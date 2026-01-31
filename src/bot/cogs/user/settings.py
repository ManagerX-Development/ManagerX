import discord
from discord.ext import commands
from discord import SlashCommandGroup
import ezcord

from mx_handler import TranslationHandler
import os
from src.bot.core.constants import ERROR_COLOR, SUCCESS_COLOR, emoji_warn, emoji_delete, AUTHOR, FOOTER
from DevTools import StatsDB, WarnDatabase, NotesDatabase, LevelDatabase
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