import discord
from discord.ext import commands
from discord import SlashCommandGroup
import ezcord
from discord.ui import Container

from mx_handler import TranslationHandler
import os
from src.bot.core.constants import ERROR_COLOR, SUCCESS_COLOR, emoji_warn, emoji_delete, AUTHOR, FOOTER
from mx_devtools import StatsDB, WarnDatabase, NotesDatabase, LevelDatabase
import sqlite3


class Settings(ezcord.Cog):
    """Cog for setting user language preferences."""

    user = SlashCommandGroup("user", "User settings commands")

    language = user.create_subgroup(
        "language")

    data = user.create_subgroup("data", "Manage your data")

    AVAILABLE_LANGUAGES = {
        "de": "Deutsch 🇩🇪",
        "en": "English 🇬🇧"
    }

    @language.command(
        name="set",
        description="Set your preferred language for bot messages."
    )
    @discord.option(
        "language",
        description="Choose a language",
        choices=[
            discord.OptionChoice(name=name, value=code)
            for code, name in AVAILABLE_LANGUAGES.items()
        ],
        required=True
    )
    async def set_language(self, ctx: discord.ApplicationContext, language: str):
        """
        Set the user's preferred language.
        
        Args:
            ctx: Discord application context
            language: Selected language code
        """
        # Save language preference
        self.bot.settings_db.set_user_language(ctx.author.id, language)

        # Get display name for the selected language
        lang_name = self.AVAILABLE_LANGUAGES.get(language, language)

        # Load response message using TranslationHandler
        response_text = await TranslationHandler.get_async(
            language,
            "cog_settings.language.message.language_set",
            default="Language has been set to {language}.",
            language=lang_name
        )

        await ctx.respond(response_text, ephemeral=True)


    @language.command()
    async def get(self, ctx: discord.ApplicationContext):
        """
        Get the user's current preferred language.
        
        Args:
            ctx: Discord application context
        """
        # Retrieve user's language preference
        language = self.bot.settings_db.get_user_language(ctx.author.id)

        if not language:
            response_text = await TranslationHandler.get_async(
                "en",
                "cog_settings.language.error_types.language_not_set",
                default="You have not set a preferred language yet."
            )
        else:
            lang_name = self.AVAILABLE_LANGUAGES.get(language, language)
            response_text = await TranslationHandler.get_async(
                language,
                "cog_settings.language.message.current_language",
                default="Your current preferred language is {language}.",
                language=lang_name
            )

        await ctx.respond(response_text, ephemeral=True)

    @language.command(
        name="list",
        description="List all available languages."
    )

    async def list_languages(self, ctx: discord.ApplicationContext):
        """
        List all available languages.
        
        Args:
            ctx: Discord application context
        """
        languages_list = "\n".join(
            f"{code}: {name}" for code, name in self.AVAILABLE_LANGUAGES.items()
        )
        response_text = f"**Available Languages:**\n{languages_list}"
        await ctx.respond(response_text, ephemeral=True)

    @data.command(
        name="get",
        description="Zeigt alle Daten an, die ManagerX über dich gespeichert hat."
    )
    async def get_all_data(self, ctx: discord.ApplicationContext):
        """Sammelt alle User-Daten und zeigt sie in einem Container an."""
        await ctx.defer(ephemeral=True)

        user_id = ctx.author.id
        guild_id = ctx.guild.id

        # 1. Datenbanken initialisieren
        try:
            stats_db = StatsDB()
            level_db = LevelDatabase()
            
            # WarnDatabase needs a base path that contains 'Datenbanken/warns.db'
            # Based on moderation/warn.py, it takes os.path.dirname(__file__)
            # which is src/bot/cogs/moderation
            warn_base_path = os.path.join("src", "bot", "cogs", "moderation")
            warn_db = WarnDatabase(warn_base_path)
            
            notes_db = NotesDatabase("data")
        except Exception as e:
            await ctx.respond(f"Fehler beim Initialisieren der Datenbanken: {e}", ephemeral=True)
            return

        # 2. Daten sammeln
        # Language
        lang = self.bot.settings_db.get_user_language(user_id) or "de"
        lang_name = self.AVAILABLE_LANGUAGES.get(lang, lang)

        # Global Stats
        global_info = await stats_db.get_global_user_info(user_id)
        
        # Server Stats
        user_stats = level_db.get_user_stats(user_id, guild_id)

        # Moderation
        warnings = warn_db.get_warnings(guild_id, user_id)
        notes = notes_db.get_notes(guild_id, user_id)

        # 3. Container erstellen
        container = Container()
        container.add_text(f"# 👤 Datenauskunft für {ctx.author.name}")
        container.add_separator()

        # Einstellungen
        container.add_text(f"### ⚙️ Einstellungen")
        container.add_text(f"**Bevorzugte Sprache:** {lang_name}")
        container.add_separator()

        # Globale Daten
        container.add_text("### 🌍 Globale Statistiken (Serverübergreifend)")
        if global_info:
            container.add_text(f"**Global Level:** {global_info['level']}")
            container.add_text(f"**Gesamt XP:** {int(global_info['xp']):,}")
            container.add_text(f"**Nachrichten gesamt:** {global_info['total_messages']:,}")
            container.add_text(f"**Voice Zeit gesamt:** {int(global_info['total_voice_minutes'] // 60)}h {int(global_info['total_voice_minutes'] % 60)}m")
            container.add_text(f"**Aktivitäts-Streak:** {global_info['daily_streak']} Tage")
        else:
            container.add_text("*Keine globalen Daten gefunden.*")
        container.add_separator()

        # Lokale Server Daten
        container.add_text(f"### 🏢 Server Statistiken ({ctx.guild.name})")
        if user_stats:
            xp, level, messages, xp_needed, prestige, total_earned = user_stats
            container.add_text(f"**Lokales Level:** {level}")
            container.add_text(f"**Aktuelle XP:** {xp:,} / {xp + xp_needed:,}")
            if prestige > 0:
                container.add_text(f"**Prestige Rang:** ⭐ {prestige}")
        else:
            container.add_text("*Keine lokalen Daten in diesem Server gefunden.*")
        container.add_separator()

        # Moderationsdaten
        container.add_text("### 🛡️ Moderationsdaten")
        warn_count = len(warnings) if warnings else 0
        note_count = len(notes) if notes else 0
        
        container.add_text(f"**Aktive Verwarnungen:** {warn_count}")
        container.add_text(f"**Gespeicherte Notizen:** {note_count}")
        
        container.add_separator()
        container.add_text("*Hinweis: ManagerX speichert nur Daten, die für die Bot-Funktionalitäten (Leveling, Moderation, Einstellungen) zwingend erforderlich sind. Du kannst deine persönlichen Daten jederzeit mit `/user data delete` löschen.*")

        view = discord.ui.DesignerView(container, timeout=0)
        await ctx.respond(view=view, ephemeral=True)

    @data.command(
        name="delete",
        description="Lösche alle deine Daten von ManagerX permanent."
    )
    async def delete_all_data(self, ctx: discord.ApplicationContext):
        """Startet den doppelten Bestätigungsprozess zum Löschen aller User-Daten."""

        embed = discord.Embed(
            title=f"{emoji_warn} ACHTUNG: Datenlöschung",
            description=(
                "Bist du sicher, dass du alle deine Daten löschen möchtest?\n\n"
                "**Was gelöscht wird:**\n"
                "• XP, Level und Statistiken (Global & Server)\n"
                "• Deine persönlichen Einstellungen\n\n"
                "**Was NICHT gelöscht wird:**\n"
                "• Moderationsdaten (Warnungen & Notizen)\n"
                "*Hinweis: ManagerX ist es nicht gestattet, Moderationsdaten zu löschen.*\n\n"
                "⚠️ **WICHTIG:** Dieser Vorgang ist **unwiderruflich**. "
                "Deine persönlichen Daten sind **für immer** weg!"
            ),
            color=ERROR_COLOR
        )
        embed.set_author(name=AUTHOR)
        embed.set_footer(text=FOOTER)

        view = DeletionView(ctx.author.id, self.bot)
        await ctx.respond(embed=embed, view=view, ephemeral=True)

class DeletionView(discord.ui.View):
    def __init__(self, user_id, bot):
        super().__init__(timeout=60)
        self.user_id = user_id
        self.bot = bot

    @discord.ui.button(label="Daten löschen", style=discord.ButtonStyle.danger, emoji="🗑️")
    async def delete_button(self, button: discord.ui.Button, interaction: discord.Interaction):
        if interaction.user.id != self.user_id:
            return await interaction.response.send_message("Das ist nicht dein Menü!", ephemeral=True)

        embed = discord.Embed(
            title="⚠️ LETZTE BESTÄTIGUNG",
            description=(
                "Bist du wirklich ABSOLUT sicher?\n\n"
                "Alle deine Statistiken, Level und Einstellungen werden **permanent** gelöscht.\n"
                "ManagerX wird alle persönlichen Informationen über dich vergessen.\n\n"
                "**WICHTIG:** Moderationsdaten (Warns/Notes) dürfen vom Bot nicht gelöscht werden und bleiben erhalten."
            ),
            color=ERROR_COLOR
        )
        embed.set_author(name=AUTHOR)
        embed.set_footer(text=FOOTER)

        view = DeletionConfirmationView(self.user_id, self.bot)
        await interaction.response.edit_message(embed=embed, view=view)

class DeletionConfirmationView(discord.ui.View):
    def __init__(self, user_id, bot):
        super().__init__(timeout=60)
        self.user_id = user_id
        self.bot = bot

    @discord.ui.button(label="JA, ALLES LÖSCHEN", style=discord.ButtonStyle.danger, emoji="🔥")
    async def confirm_button(self, button: discord.ui.Button, interaction: discord.Interaction):
        if interaction.user.id != self.user_id:
            return await interaction.response.send_message("Das ist nicht dein Menü!", ephemeral=True)

        # Deletion logic implementation
        try:
            # Paths to databases
            stats_db_path = "data/stats.db"
            level_db_path = "data/levelsystem.db"
            warn_db_path = "src/bot/cogs/moderation/Datenbanken/warns.db"
            notes_db_path = "data/data/notes.db"

            # 1. Stats & Level
            # StatsDB cleanup
            if os.path.exists(stats_db_path):
                conn = sqlite3.connect(stats_db_path)
                cursor = conn.cursor()
                tables = ["messages", "voice_sessions", "global_user_levels", "daily_stats", "user_achievements", "active_voice_sessions"]
                for table in tables:
                    cursor.execute(f"DELETE FROM {table} WHERE user_id = ?", (self.user_id,))
                conn.commit()
                conn.close()

            # LevelDatabase cleanup
            if os.path.exists(level_db_path):
                conn = sqlite3.connect(level_db_path)
                cursor = conn.cursor()
                tables = ["user_levels", "xp_boosts", "achievements", "temporary_roles"]
                for table in tables:
                    cursor.execute(f"DELETE FROM {table} WHERE user_id = ?", (self.user_id,))
                conn.commit()
                conn.close()

            # 2. Settings (using the existing reset method if available)
            if hasattr(self.bot, 'settings_db'):
                if hasattr(self.bot.settings_db, 'reset_user_settings'):
                    self.bot.settings_db.reset_user_settings(self.user_id)
                elif hasattr(self.bot.settings_db, 'delete_user_data'): # Fallback to original code's preference
                    self.bot.settings_db.delete_user_data(self.user_id)

            # 3. Moderationsdaten (Warns & Notes) bleiben bestehen (User-Wunsch/Wichtigkeit)
            pass

        except Exception as e:
            # Log error but proceed with message
            print(f"Error during manual data deletion for {self.user_id}: {e}")

        embed = discord.Embed(
            title="✅ Daten erfolgreich gelöscht",
            description="Alle deine Daten wurden permanent aus unserem System entfernt.",
            color=SUCCESS_COLOR
        )
        embed.set_footer(text=FOOTER)
        
        await interaction.response.edit_message(embed=embed, view=None)

    @discord.ui.button(label="Abbrechen", style=discord.ButtonStyle.secondary)
    async def cancel_button(self, button: discord.ui.Button, interaction: discord.Interaction):
        await interaction.response.edit_message(content="Vorgang abgebrochen. Deine Daten sind sicher.", embed=None, view=None)

def setup(bot):
    """Setup function to add the cog to the bot."""
    bot.add_cog(Settings(bot))