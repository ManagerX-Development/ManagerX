import discord
from discord.ext import commands, tasks
from discord import slash_command, Option, SlashCommandGroup
import ezcord
import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Optional

from mxmariadb import GlobalChatDatabase
from ._config import GlobalChatConfig
from ._validator import MessageValidator
from ._embeds import EmbedBuilder
from ._sender import GlobalChatSender

logger = logging.getLogger(__name__)
db = GlobalChatDatabase()

class GlobalChat(ezcord.Cog):
    globalchat = SlashCommandGroup("globalchat", "GlobalChat Verwaltung")

    def __init__(self, bot):
        self.bot = bot
        self.config = GlobalChatConfig()
        self.validator = MessageValidator(self.config)
        self.embed_builder = EmbedBuilder(self.config, bot)
        self.message_cooldown = commands.CooldownMapping.from_cooldown(
            self.config.RATE_LIMIT_MESSAGES,
            self.config.RATE_LIMIT_SECONDS,
            commands.BucketType.user
        )
        self.sender = GlobalChatSender(self.bot, self.config, self.embed_builder)
        self.cleanup_task.start()
        self.bot.loop.create_task(db.create_tables())

    @tasks.loop(hours=12)
    async def cleanup_task(self):
        await self.sender._get_all_active_channels()
        logger.info("🧠 GlobalChat: Channel-Cache neu geladen.")

    @discord.message_command(name="Nachricht melden")
    async def report_message_context(self, ctx: discord.ApplicationContext, message: discord.Message):
        """Kontextmenü-Befehl zum Melden einer GlobalChat-Nachricht."""
        if message.author.id != self.bot.user.id or not message.embeds:
            await ctx.respond("❌ Das ist keine gültige GlobalChat-Nachricht.", ephemeral=True)
            return
            
        embed = message.embeds[0]
        footer_text = embed.footer.text if embed.footer else ""
        
        if not footer_text or "ID:" not in footer_text:
            await ctx.respond("❌ Das ist keine gültige GlobalChat-Nachricht.", ephemeral=True)
            return

        owners = getattr(self.config, 'BOT_OWNERS', [1093555256689959005, 1427994077332373554])
        report_embed = discord.Embed(
            title="⚠️ GlobalChat Meldung (App-Command)",
            description=f"Eine Nachricht wurde über das Kontextmenü gemeldet.\n\n"
                        f"**Gemeldete Nachricht Infos:**\n"
                        f"**Autor:** {embed.author.name if embed.author else 'Unbekannt'}\n"
                        f"**Herkunft (Footer):** `{footer_text}`\n"
                        f"**Melder:** {ctx.author.mention} (`{ctx.author.id}`)\n"
                        f"**Gemeldet auf Server:** {ctx.guild.name} (`{ctx.guild.id}`)",
            color=discord.Color.red(),
            timestamp=discord.utils.utcnow()
        )
        
        if embed.description:
            report_embed.add_field(name="Nachrichten-Inhalt", value=embed.description[:1024], inline=False)
            
        if embed.image:
            report_embed.set_image(url=embed.image.url)
            
        success_count = 0
        for owner_id in owners:
            try:
                owner = await self.bot.fetch_user(owner_id)
                await owner.send(embed=report_embed)
                success_count += 1
            except Exception: pass
            
        if success_count > 0:
            await ctx.respond("✅ Danke! Die Nachricht wurde an das Moderations-Team weitergeleitet.", ephemeral=True)
        else:
            await ctx.respond("⚠️ Die Nachricht wurde erfasst, konnte aber aktuell keinem Admin zugestellt werden.", ephemeral=True)

    @ezcord.Cog.listener()
    async def on_message(self, message: discord.Message):
        if not message.guild or message.author.bot:
            return

        global_chat_channel_id = await db.get_globalchat_channel(message.guild.id)
        if message.channel.id != global_chat_channel_id:
            return

        settings = await db.get_guild_settings(message.guild.id)
        is_valid, reason = await self.validator.validate_message(message, settings)
        
        if not is_valid:
            logger.debug(f"❌ Nachricht abgelehnt: {reason} (User: {message.author.id})")
            if any(keyword in reason for keyword in ["Blacklist", "NSFW", "Gefilterte", "Ungültige Anhänge", "zu groß"]):
                try:
                    await message.add_reaction("❌")
                    if "Ungültige Anhänge" in reason or "zu groß" in reason:
                        await message.reply(
                            f"❌ **Fehler:** {reason}\n"
                            f"**Max. Größe:** {self.config.MAX_FILE_SIZE_MB}MB pro Datei\n"
                            f"**Max. Anhänge:** {self.config.MAX_ATTACHMENTS}",
                            delete_after=7
                        )
                    await asyncio.sleep(2)
                    await message.delete()
                except (discord.Forbidden, discord.NotFound):
                    pass
            return

        from mxmariadb import EconomyDatabase
        eco_db = EconomyDatabase()
        user_info = await eco_db.get_user_economy_info(message.author.id)
        last_msg_raw = user_info.get('last_message_at') if user_info else None
        
        can_earn = True
        if last_msg_raw:
            try:
                try:
                    last_dt = datetime.strptime(last_msg_raw, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    last_dt = datetime.fromisoformat(last_msg_raw)
                if datetime.utcnow() < last_dt + timedelta(seconds=30):
                    can_earn = False
            except Exception:
                pass
        if can_earn:
            await eco_db.add_global_coins(message.author.id, random.randint(5, 15))
            await eco_db.update_last_message(message.author.id)

        bucket = self.message_cooldown.get_bucket(message)
        retry_after = bucket.update_rate_limit()
        if retry_after:
            try:
                await message.add_reaction("⏰")
                await asyncio.sleep(2)
                await message.delete()
                logger.debug(f"⏰ Nachricht von {message.author.id} wegen Rate Limit entfernt.")
            except (discord.Forbidden, discord.NotFound):
                pass
            return

        attachment_data = []
        if message.attachments:
            try:
                await message.channel.trigger_typing()
                for attachment in message.attachments:
                    if attachment.size <= self.config.MAX_FILE_SIZE_MB * 1024 * 1024:
                        data = await attachment.read()
                        attachment_data.append((attachment.filename, data, attachment.content_type))
            except Exception as e:
                logger.error(f"❌ Fehler beim Herunterladen von Attachments: {e}")
                attachment_data = []

        try:
            await message.delete()
        except discord.Forbidden:
            logger.warning(f"⚠️ Keine Permissions zum Löschen der Original-Nachricht in {message.channel.id}")
        except discord.NotFound:
            pass

        successful, failed = await self.sender.send_global_message(message, attachment_data)
        logger.info(f"🌍 GlobalChat: Nachricht von {message.guild.name} | User: {message.author.name} | ✅ {successful} | ❌ {failed}")

    @globalchat.command(name="setup", description="Richtet einen GlobalChat-Channel ein")
    async def setup_globalchat(
        self,
        ctx: discord.ApplicationContext,
        channel: discord.TextChannel = Option(discord.TextChannel, "Der GlobalChat-Channel", required=True)
    ):
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        bot_perms = channel.permissions_for(ctx.guild.me)
        missing_perms = []
        if not bot_perms.send_messages: missing_perms.append("Nachrichten senden")
        if not bot_perms.manage_messages: missing_perms.append("Nachrichten verwalten")
        if not bot_perms.embed_links: missing_perms.append("Links einbetten")
        if not bot_perms.read_message_history: missing_perms.append("Nachrichten-Historie lesen")
        if not bot_perms.attach_files: missing_perms.append("Dateien anhängen")

        if missing_perms:
            await ctx.respond(
                f"❌ Mir fehlen wichtige Berechtigungen in {channel.mention}:\n" +
                "\n".join([f"• {p}" for p in missing_perms]),
                ephemeral=True
            )
            return

        try:
            await db.set_globalchat_channel(ctx.guild.id, channel.id)
            self.sender._cached_channels = await self.sender._fetch_all_channels()

            from discord.ui import Container
            container = Container()
            status_text = (
                f"✅ **GlobalChat eingerichtet!**\n\n"
                f"Der GlobalChat ist nun in {channel.mention} aktiv.\n"
                f"Aktuell verbunden: **{len(self.sender._cached_channels)}** Server."
            )
            container.add_text(status_text)
            container.add_separator()
            container.add_text(
                "**Unterstützte Features:**\n"
                "• 🖼️ Bilder, 🎥 Videos, 🎵 Audio\n"
                "• 📄 Dokumente (Office, PDF, Archive)\n"
                "• 🎨 Discord Sticker\n"
                "• 🔗 Automatische Link-Previews\n"
                "• ↩️ Reply auf andere Nachrichten\n\n"
                "**Nächste Schritte:**\n"
                "• `/globalchat settings` - Einstellungen anpassen\n"
                "• `/globalchat stats` - Statistiken anzeigen\n"
                "• `/globalchat media-info` - Medien-Limits anzeigen"
            )
            view = discord.ui.DesignerView(container, timeout=None)
            await ctx.respond(view=view, ephemeral=True)
        except Exception as e:
            logger.error(f"❌ Setup-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)

    @globalchat.command(name="remove", description="Entfernt den GlobalChat-Channel")
    async def remove_globalchat(self, ctx: discord.ApplicationContext):
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        channel_id = await db.get_globalchat_channel(ctx.guild.id)
        if not channel_id:
            await ctx.respond("❌ GlobalChat ist auf diesem Server nicht eingerichtet.", ephemeral=True)
            return

        try:
            await db.set_globalchat_channel(ctx.guild.id, None)
            self.sender._cached_channels = await self.sender._fetch_all_channels()
            await ctx.respond(
                f"✅ **GlobalChat entfernt!**\n\n"
                f"Der GlobalChat wurde von diesem Server entfernt.\n"
                f"Es sind nun noch **{len(self.sender._cached_channels)}** Server verbunden.",
                ephemeral=True
            )
        except Exception as e:
            logger.error(f"❌ Remove-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)

    @globalchat.command(name="settings", description="Verwaltet Server-spezifische GlobalChat-Einstellungen")
    async def settings_globalchat(
        self,
        ctx: discord.ApplicationContext,
        filter_enabled: Optional[bool] = Option(bool, "Content-Filter aktivieren/deaktivieren", required=False),
        nsfw_filter: Optional[bool] = Option(bool, "NSFW-Filter aktivieren/deaktivieren", required=False),
        embed_color: Optional[str] = Option(str, "Hex-Farbcode für Embeds (z.B. #FF00FF)", required=False),
        max_message_length: Optional[int] = Option(int, "Maximale Nachrichtenlänge", required=False, min_value=50, max_value=2000)
    ):
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        if not await db.get_globalchat_channel(ctx.guild.id):
            await ctx.respond("❌ Dieser Server nutzt GlobalChat nicht!\nNutze `/globalchat setup` zuerst.", ephemeral=True)
            return

        import re
        updated = []
        if filter_enabled is not None:
            if await db.update_guild_setting(ctx.guild.id, 'filter_enabled', filter_enabled):
                updated.append(f"Content-Filter: {'✅ An' if filter_enabled else '❌ Aus'}")

        if nsfw_filter is not None:
            if await db.update_guild_setting(ctx.guild.id, 'nsfw_filter', nsfw_filter):
                updated.append(f"NSFW-Filter: {'✅ An' if nsfw_filter else '❌ Aus'}")

        if embed_color:
            if not re.match(r'^#[0-9a-fA-F]{6}$', embed_color):
                await ctx.respond("❌ Ungültiger Hex-Farbcode. Erwarte z.B. `#5865F2`.", ephemeral=True)
                return
            if await db.update_guild_setting(ctx.guild.id, 'embed_color', embed_color):
                updated.append(f"Embed-Farbe: `{embed_color}`")

        if max_message_length is not None:
            if await db.update_guild_setting(ctx.guild.id, 'max_message_length', max_message_length):
                updated.append(f"Max. Länge: **{max_message_length}** Zeichen")

        if not updated:
            await ctx.respond("ℹ️ Keine Änderungen vorgenommen.", ephemeral=True)
            return

        embed = discord.Embed(
            title="✅ GlobalChat Einstellungen aktualisiert",
            description="\n".join(updated),
            color=discord.Color.green()
        )
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="ban", description="🔨 Bannt einen User oder Server vom GlobalChat")
    async def globalchat_ban(
        self,
        ctx: discord.ApplicationContext,
        entity_id: str = Option(str, "ID des Users oder Servers (Guild-ID)", required=True),
        entity_type: str = Option(str, "Typ der Entität", choices=["user", "guild"], required=True),
        reason: str = Option(str, "Grund für den Ban", required=True),
        duration: Optional[int] = Option(int, "Dauer in Stunden (optional, permanent wenn leer)", required=False)
    ):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        try:
            entity_id_int = int(entity_id)
        except ValueError:
            await ctx.respond("❌ Ungültige ID. Erwarte eine Zahl.", ephemeral=True)
            return

        try:
            success = await db.add_to_blacklist(entity_type, entity_id_int, reason, ctx.author.id, duration)
            if not success:
                await ctx.respond("❌ Fehler beim Bannen!", ephemeral=True)
                return

            duration_text = f"{duration} Stunden" if duration else "Permanent"
            embed = discord.Embed(title="🔨 GlobalChat-Ban verhängt", color=discord.Color.red(), timestamp=datetime.utcnow())
            embed.add_field(name="Typ", value=entity_type.title(), inline=True)
            embed.add_field(name="ID", value=f"`{entity_id_int}`", inline=True)
            embed.add_field(name="Dauer", value=duration_text, inline=True)
            embed.add_field(name="Grund", value=reason, inline=False)
            embed.add_field(name="Von", value=ctx.author.mention, inline=True)
            if duration:
                expires = datetime.utcnow() + timedelta(hours=duration)
                embed.add_field(name="Läuft ab", value=f"<t:{int(expires.timestamp())}:R>", inline=True)
            await ctx.respond(embed=embed)
            logger.info(f"🔨 Ban: {entity_type} {entity_id_int} | Grund: {reason} | Dauer: {duration_text} | Von: {ctx.author.id}")
        except Exception as e:
            logger.error(f"❌ Ban-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten beim Bannen!", ephemeral=True)

    @globalchat.command(name="unban", description="🔓 Entfernt einen User oder Server von der GlobalChat-Blacklist")
    async def globalchat_unban(
        self,
        ctx: discord.ApplicationContext,
        entity_id: str = Option(str, "ID des Users oder Servers", required=True),
        entity_type: str = Option(str, "Typ der Entität", choices=["user", "guild"], required=True)
    ):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        try:
            entity_id_int = int(entity_id)
        except ValueError:
            await ctx.respond("❌ Ungültige ID. Erwarte eine Zahl.", ephemeral=True)
            return

        try:
            if not await db.is_blacklisted(entity_type, entity_id_int):
                await ctx.respond(f"ℹ️ {entity_type.title()} `{entity_id_int}` ist nicht auf der Blacklist.", ephemeral=True)
                return

            if await db.remove_from_blacklist(entity_type, entity_id_int):
                embed = discord.Embed(
                    title="🔓 GlobalChat-Unban erfolgreich",
                    description=f"{entity_type.title()} mit ID `{entity_id_int}` wurde von der Blacklist entfernt.",
                    color=discord.Color.green(),
                    timestamp=datetime.utcnow()
                )
                await ctx.respond(embed=embed)
                logger.info(f"🔓 Unban: {entity_type} {entity_id_int} | Von: {ctx.author.id}")
            else:
                await ctx.respond("❌ Fehler beim Entfernen von der Blacklist!", ephemeral=True)
        except Exception as e:
            logger.error(f"❌ Unban-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten beim Unbannen!", ephemeral=True)

    @globalchat.command(name="info", description="Zeigt Informationen über den GlobalChat")
    async def globalchat_info(self, ctx: discord.ApplicationContext):
        active_servers = await self.sender._get_all_active_channels()
        guild_settings = await db.get_guild_settings(ctx.guild.id)

        embed = discord.Embed(
            title="🌍 GlobalChat - Vollständiger Medien-Support",
            description=(
                "Ein serverübergreifendes Chat-System mit vollständigem Medien-Support.\n\n"
                f"**📊 Aktuell verbunden:** **{len(active_servers)}** Server\n\n"
                "**🎯 Hauptfeatures:**\n"
                "• Nachrichten werden an alle verbundenen Server gesendet\n"
                "• Vollständiger Medien-Support (Bilder, Videos, Audio, Dokumente)\n"
                "• Discord Sticker und Link-Previews\n"
                "• Reply-Unterstützung mit Kontext\n"
                "• Automatische Moderation und Filter\n"
                "• Rate-Limiting gegen Spam\n"
                "• Individuelle Server-Einstellungen"
            ),
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )
        embed.add_field(
            name="📁 Unterstützte Medien (Details: `/globalchat media-info`)",
            value="• 🖼️ Bilder\n• 🎥 Videos\n• 🎵 Audio\n• 📄 Dokumente (PDF, Office, Archive)",
            inline=True
        )
        embed.add_field(
            name="🛡️ Moderation",
            value=(
                f"• **Content-Filter:** {'✅ An' if guild_settings.get('filter_enabled', True) else '❌ Aus'}\n"
                f"• **NSFW-Filter:** {'✅ An' if guild_settings.get('nsfw_filter', True) else '❌ Aus'}\n"
                f"• **Nachrichtenlänge:** {guild_settings.get('max_message_length', self.config.DEFAULT_MAX_MESSAGE_LENGTH)} Zeichen"
            ),
            inline=True
        )
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="stats", description="Zeigt GlobalChat-Statistiken")
    async def globalchat_stats(self, ctx: discord.ApplicationContext):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        user_bans, guild_bans = await db.get_blacklist_stats()
        active_servers = await self.sender._get_all_active_channels()

        embed = discord.Embed(title="📊 GlobalChat System-Statistiken", color=discord.Color.gold(), timestamp=datetime.utcnow())
        embed.add_field(name="🌍 Verbundene Server", value=f"**{len(active_servers)}**", inline=True)
        embed.add_field(name="👥 Gebannte User", value=f"**{user_bans}**", inline=True)
        embed.add_field(name="🛡️ Gebannte Server", value=f"**{guild_bans}**", inline=True)
        embed.add_field(name="⏳ Cache-Dauer", value=f"{self.config.CACHE_DURATION} Sekunden", inline=True)
        embed.add_field(name="📜 Protokoll Bereinigung", value=f"Alle {self.config.CLEANUP_DAYS} Tage", inline=True)
        embed.add_field(name="⏰ Rate-Limit", value=f"{self.config.RATE_LIMIT_MESSAGES} Nachrichten / {self.config.RATE_LIMIT_SECONDS} Sekunden", inline=True)
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="media-info", description="Zeigt Details zu Medien-Limits und erlaubten Formaten")
    async def globalchat_media_info(self, ctx: discord.ApplicationContext):
        embed = discord.Embed(
            title="📁 GlobalChat Medien-Limits & Formate",
            description="Details zu den maximal erlaubten Dateigrößen und unterstützten Formaten.",
            color=discord.Color.purple(),
            timestamp=datetime.utcnow()
        )
        embed.add_field(
            name="⚠️ Wichtige Limits",
            value=(
                f"• **Max. {self.config.MAX_ATTACHMENTS} Anhänge** pro Nachricht\n"
                f"• **Max. {self.config.MAX_FILE_SIZE_MB} MB** pro Datei\n"
                f"• **Max. {self.config.DEFAULT_MAX_MESSAGE_LENGTH} Zeichen** Textlänge\n"
                f"• **Rate-Limit:** {self.config.RATE_LIMIT_MESSAGES} Nachrichten pro {self.config.RATE_LIMIT_SECONDS} Sekunden"
            ),
            inline=False
        )
        embed.add_field(name="🖼️ Bilder", value=", ".join(self.config.ALLOWED_IMAGE_FORMATS).upper(), inline=True)
        embed.add_field(name="🎥 Videos", value=", ".join(self.config.ALLOWED_VIDEO_FORMATS).upper(), inline=True)
        embed.add_field(name="🎵 Audio", value=", ".join(self.config.ALLOWED_AUDIO_FORMATS).upper(), inline=True)
        embed.add_field(name="📄 Dokumente/Archive", value=", ".join(self.config.ALLOWED_DOCUMENT_FORMATS).upper(), inline=False)
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="help", description="Zeigt die Hilfe-Seite für GlobalChat")
    async def globalchat_help(self, ctx: discord.ApplicationContext):
        embed = discord.Embed(
            title="❓ GlobalChat Hilfe & Übersicht",
            description="Übersicht aller verfügbaren Commands und Features.",
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )
        embed.add_field(
            name="⚙️ Setup & Verwaltung",
            value="`/globalchat setup` - Channel einrichten\n`/globalchat remove` - Channel entfernen\n`/globalchat settings` - Einstellungen anpassen",
            inline=False
        )
        embed.add_field(
            name="📊 Informationen",
            value="`/globalchat info` - Allgemeine Infos\n`/globalchat stats` - Statistiken anzeigen\n`/globalchat media-info` - Medien-Details\n`/globalchat help` - Diese Hilfe",
            inline=False
        )
        if ctx.author.id in self.config.BOT_OWNERS:
            embed.add_field(
                name="🛡️ Moderation (Bot Owner)",
                value="`/globalchat ban` - User/Server bannen\n`/globalchat unban` - User/Server entbannen",
                inline=False
            )
            embed.add_field(
                name="🧪 Test & Debug (Bot Owner)",
                value="`/globalchat test-media` - Medien-Test\n`/globalchat broadcast` - Nachricht an alle senden\n`/globalchat reload-cache` - Cache neu laden\n`/globalchat debug` - Debug-Info",
                inline=False
            )
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="test-media", description="🧪 Test-Command für Medien-Upload und -Anzeige")
    async def globalchat_test_media(self, ctx: discord.ApplicationContext):
        channel_id = await db.get_globalchat_channel(ctx.guild.id)
        if not channel_id:
            await ctx.respond("❌ GlobalChat ist auf diesem Server nicht eingerichtet.", ephemeral=True)
            return

        embed = discord.Embed(
            title="🧪 GlobalChat Medien-Test",
            description=(
                "Dieser Test zeigt dir, welche Medien-Typen erfolgreich übermittelt werden können.\n\n"
                "**Unterstützte Medien:**\n• Bilder, Videos, Audio, Dokumente\n• Discord Sticker\n• Antworten auf andere Nachrichten\n\n"
                "**So testest du:**\n"
                f"1. Gehe zu <#{channel_id}> und sende eine Nachricht mit Anhängen.\n"
                "2. Die Nachricht erscheint auf allen verbundenen Servern.\n\n"
                "Probiere verschiedene Kombinationen aus!"
            ),
            color=discord.Color.green(),
            timestamp=datetime.utcnow()
        )
        embed.add_field(
            name="📊 Aktuelle Limits",
            value=f"• Max. {self.config.MAX_ATTACHMENTS} Anhänge\n• Max. {self.config.MAX_FILE_SIZE_MB} MB pro Datei\n• {self.config.RATE_LIMIT_MESSAGES} Nachrichten / {self.config.RATE_LIMIT_SECONDS} Sekunden",
            inline=True
        )
        embed.add_field(name="✅ Unterstützte Formate", value="Bilder, Videos, Audio,\nDokumente, Archive,\nOffice-Dateien, PDFs", inline=True)
        embed.set_footer(text=f"Test von {ctx.author}", icon_url=ctx.author.display_avatar.url)
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="broadcast", description="📢 Sendet eine Nachricht an alle verbundenen GlobalChat-Server")
    async def globalchat_broadcast(
        self,
        ctx: discord.ApplicationContext,
        title: str = Option(str, "Der Titel der Broadcast-Nachricht", required=True),
        message: str = Option(str, "Die Nachricht selbst", required=True)
    ):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            embed = discord.Embed(
                title=f"📢 GlobalChat Broadcast: {title}",
                description=message,
                color=discord.Color.red(),
                timestamp=datetime.utcnow()
            )
            embed.set_footer(text=f"GlobalChat Broadcast von {ctx.author}", icon_url=ctx.author.display_avatar.url)

            successful, failed = await self.sender.send_global_broadcast_message(embed)

            result_embed = discord.Embed(title="✅ Broadcast gesendet", color=discord.Color.green(), timestamp=datetime.utcnow())
            result_embed.add_field(
                name="📊 Ergebnis",
                value=f"**Erfolgreich:** {successful}\n**Fehlgeschlagen:** {failed}\n**Gesamt:** {successful + failed}",
                inline=False
            )
            result_embed.add_field(
                name="📝 Nachricht",
                value=f"**{title}**\n{message[:100]}{'...' if len(message) > 100 else ''}",
                inline=False
            )
            await ctx.respond(embed=result_embed, ephemeral=True)
            logger.info(f"📢 Broadcast: '{title}' | Von: {ctx.author} | ✅ {successful} | ❌ {failed}")
        except Exception as e:
            logger.error(f"❌ Broadcast-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Fehler beim Senden des Broadcasts!", ephemeral=True)

    @globalchat.command(name="reload-cache", description="🧠 Lädt alle Cache-Daten neu (Admin)")
    async def globalchat_reload_cache(self, ctx: discord.ApplicationContext):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            old_count = len(self.sender._cached_channels or [])
            self.sender._cached_channels = await self.sender._fetch_all_channels()
            new_count = len(self.sender._cached_channels)
            await ctx.respond(
                f"✅ **Cache neu geladen!**\n\nAlte Channel-Anzahl: **{old_count}**\nNeue Channel-Anzahl: **{new_count}**",
                ephemeral=True
            )
            logger.info(f"🧠 GlobalChat Cache manuell neu geladen. {old_count} -> {new_count}")
        except Exception as e:
            logger.error(f"❌ Cache Reload Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)

    @globalchat.command(name="debug", description="🐛 Zeigt Debug-Informationen an (Admin)")
    async def globalchat_debug(self, ctx: discord.ApplicationContext):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            cached_channels = len(self.sender._cached_channels or [])
            all_settings = await db.get_all_guild_settings()
            user_bans, guild_bans = await db.get_blacklist_stats()

            debug_info = (
                f"**Bot-Status:**\n"
                f"• Latency: `{round(self.bot.latency * 1000)}ms`\n"
                f"• Guilds: `{len(self.bot.guilds)}`\n"
                f"• Uptime: `<t:{int(self.bot.start_time.timestamp())}:R>`\n\n"
                f"**GlobalChat-Status:**\n"
                f"• Aktive Channels (Cache): `{cached_channels}`\n"
                f"• DB Settings Einträge: `{len(all_settings)}`\n"
                f"• Cleanup Task: `{'Aktiv' if self.cleanup_task.is_running() else 'Inaktiv'}`\n"
                f"• Gebannte User/Server: `{user_bans} / {guild_bans}`"
            )

            embed = discord.Embed(
                title="🐛 GlobalChat Debug-Informationen",
                description=debug_info,
                color=discord.Color.orange(),
                timestamp=datetime.utcnow()
            )
            await ctx.respond(embed=embed, ephemeral=True)
        except Exception as e:
            logger.error(f"❌ Debug Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)
