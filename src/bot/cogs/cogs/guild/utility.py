import discord
from discord.ext import commands
from discord import SlashCommandGroup
import ezcord
import time
import os
from datetime import datetime

from discord.ui import Container, DesignerView, Thumbnail, Section, TextDisplay
from discord.ui.separator import SeparatorSpacingSize

class Utility(ezcord.Cog):
    """Premium Utility commands for server and user information."""

    @discord.slash_command(name="ping", description="Prüft die Latenz des Bots.")
    async def ping(self, ctx: discord.ApplicationContext):
        start_time = time.time()
        # Initial response to measure round-trip
        await ctx.defer(ephemeral=True)
        end_time = time.time()
        
        round_trip = round((end_time - start_time) * 1000)
        api_latency = round(self.bot.latency * 1000)

        container = Container()
        container.add_text("📡 **Bot Latenz Übersicht**")
        container.add_separator(spacing=SeparatorSpacingSize.small)
        container.add_text(f"❯ **API-Latenz:** `{api_latency}ms`")
        container.add_text(f"❯ **Round Trip:** `{round_trip}ms`")
        
        view = DesignerView(container, timeout=60)
        await ctx.respond(view=view, ephemeral=True)

    @discord.slash_command(name="serverinfo", description="Zeigt detaillierte Informationen über den Server.")
    async def serverinfo(self, ctx: discord.ApplicationContext):
        guild = ctx.guild
        owner = guild.owner
        
        container = Container()
        
        # Header Section with Icon
        header_text = f"🏰 **Server Übersicht: {guild.name}**"
        if guild.icon:
            container.add_section(TextDisplay(header_text), accessory=Thumbnail(guild.icon.url))
        else:
            container.add_text(header_text)
        
        container.add_separator(spacing=SeparatorSpacingSize.small)
        
        general_info = (
            f"❯ **Besitzer:** {owner.mention}\n"
            f"❯ **Erstellt:** <t:{int(guild.created_at.timestamp())}:R>\n"
            f"❯ **ID:** `{guild.id}`"
        )
        container.add_text(general_info)
        
        container.add_separator(spacing=SeparatorSpacingSize.large)
        
        stats_info = (
            f"👥 **Mitglieder:** `{guild.member_count}`\n"
            f"🛡️ **Sicherheit:** `{str(guild.verification_level).capitalize()}`\n"
            f"🚀 **Boosts:** `{guild.premium_subscription_count}` (Level {guild.premium_tier})"
        )
        container.add_text(stats_info)
        
        container.add_separator(spacing=SeparatorSpacingSize.large)
        
        channels_info = (
            f"📁 **Kategorien:** `{len(guild.categories)}`\n"
            f"💬 **Textkanäle:** `{len(guild.text_channels)}`\n"
            f"🔊 **Sprachkanäle:** `{len(guild.voice_channels)}`"
        )
        container.add_text(channels_info)
        
        view = DesignerView(container, timeout=120)
        await ctx.respond(view=view)

    @discord.slash_command(name="userinfo", description="Zeigt detaillierte Informationen über einen Nutzer.")
    @discord.option("user", description="Wähle einen Nutzer", required=False)
    async def userinfo(self, ctx: discord.ApplicationContext, user: discord.Member = None):
        user = user or ctx.author
        
        container = Container()
        
        # Status Map
        status_map = {
            discord.Status.online: "🟢 Online",
            discord.Status.idle: "🟡 Abwesend",
            discord.Status.dnd: "🔴 Bitte nicht stören",
            discord.Status.offline: "⚫ Offline",
            discord.Status.invisible: "⚫ Unsichtbar"
        }
        status_text = status_map.get(user.status, "⚫ Unbekannt")
        
        # Activity Header
        activity_text = None
        if user.activities:
            activity = user.activities[0]
            if activity.type == discord.ActivityType.listening:
                activity_text = f"🎵 Hört gerade: *{activity.name}*"
            elif activity.type == discord.ActivityType.playing:
                activity_text = f"🎮 Spielt gerade: *{activity.name}*"
            else:
                activity_text = f"❯ Aktivität: *{activity.name}*"

        # Profile Section with Avatar
        header_items = [TextDisplay(f"👤 **Nutzerprofil: {user.name}**")]
        header_items.append(TextDisplay(f"❯ Status: {status_text}"))
        if activity_text:
            header_items.append(TextDisplay(activity_text))
            
        container.add_section(*header_items, accessory=Thumbnail(user.display_avatar.url))

        container.add_separator(spacing=SeparatorSpacingSize.small)
        
        # Identity Block
        is_bot = "🤖 Ja" if user.bot else "👤 Nein"
        identity_info = (
            f"🆔 **ID:** `{user.id}`\n"
            f"🤖 **Bot:** {is_bot}\n"
            f"📅 **Erstellt:** <t:{int(user.created_at.timestamp())}:R>"
        )
        container.add_text(identity_info)
        
        container.add_separator(spacing=SeparatorSpacingSize.large)
        
        # Server Status Block
        server_info = (
            f"📥 **Beigetreten:** <t:{int(user.joined_at.timestamp())}:R>\n"
            f"🔝 **Höchste Rolle:** {user.top_role.mention if user.top_role else 'Keine'}"
        )
        container.add_text(server_info)
        
        container.add_separator(spacing=SeparatorSpacingSize.small)
        
        # Roles Block
        roles = [role.mention for role in reversed(user.roles[1:])]
        roles_text = ", ".join(roles[:8]) + (f" (+{len(roles)-8})" if len(roles) > 8 else "")
        container.add_text(f"🎭 **Rollen ({len(roles)})**\n{roles_text or '*Keine Rollen*'}")
        
        container.add_separator(spacing=SeparatorSpacingSize.large)
        
        # Privileges Block
        perms = []
        if user.guild_permissions.administrator: perms.append("Administrator")
        if user.guild_permissions.manage_guild: perms.append("Server verwalten")
        if user.guild_permissions.manage_roles: perms.append("Rollen verwalten")
        if user.guild_permissions.manage_channels: perms.append("Kanäle verwalten")
        if user.guild_permissions.kick_members: perms.append("Mitglieder kicken")
        if user.guild_permissions.ban_members: perms.append("Mitglieder bannen")
        
        if perms:
            container.add_text(f"🛡️ **Wichtige Berechtigungen:**\n`{'`, `'.join(perms)}`")
        else:
            container.add_text("🛡️ **Wichtige Berechtigungen:** Keine speziellen Berechtigungen")

        view = DesignerView(container, timeout=120)
        await ctx.respond(view=view)


def setup(bot):
    bot.add_cog(Utility(bot))
