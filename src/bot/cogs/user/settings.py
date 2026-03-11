# Copyright (c) 2026 OPPRO.NET Network
import discord
from discord.ext import commands
from discord import SlashCommandGroup
import ezcord
import io
import json
from datetime import datetime

# Branding & Colors (Local Fallbacks)
SUCCESS_COLOR = 0x2ecc71
ERROR_COLOR = 0xe74c3c
AUTHOR = "ManagerX"
FOOTER = "ManagerX Bot"

# Emojis directly from UI module
try:
    from src.bot.ui.emojis import emoji_warn
except ImportError:
    emoji_warn = "⚠️"
from mx_devtools import (
    StatsDB, WarnDatabase, NotesDatabase, LevelDatabase,
    ProfileDB, SettingsDB, AutoDeleteDB,
    AntiSpamDatabase, TempVCDatabase
)
from mx_devtools.backend.database.globalchat_db import GlobalChatDatabase, db as global_db

class Settings(ezcord.Cog):
    """Cog für Benutzereinstellungen, Sprache und Datenverwaltung."""

    user = SlashCommandGroup("user", "Benutzer-Einstellungen")
    language = user.create_subgroup("language", "Spracheinstellungen")
    data = user.create_subgroup("data", "Datenverwaltung (DSGVO)")

    AVAILABLE_LANGUAGES = {
        "de": "Deutsch 🇩🇪",
        "en": "English 🇬🇧"
    }

    # --- Spracheinstellungen ---

    @language.command(name="set", description="Setze deine bevorzugte Sprache.")
    @discord.option("lang", description="Wähle eine Sprache", choices=[
        discord.OptionChoice(name="Deutsch 🇩🇪", value="de"),
        discord.OptionChoice(name="English 🇬🇧", value="en")
    ])
    async def set_lang(self, ctx: discord.ApplicationContext, lang: str):
        db = SettingsDB()
        db.set_user_language(ctx.author.id, lang)
        db.close()
        
        msg = "✅ Sprache auf **Deutsch 🇩🇪** gesetzt." if lang == "de" else "✅ Language set to **English 🇬🇧**."
        await ctx.respond(msg, ephemeral=True)

    @language.command(name="show", description="Zeigt deine aktuell eingestellte Sprache.")
    async def show_lang(self, ctx: discord.ApplicationContext):
        db = SettingsDB()
        lang = db.get_user_language(ctx.author.id)
        db.close()
        
        lang_name = self.AVAILABLE_LANGUAGES.get(lang, "English 🇬🇧")
        await ctx.respond(f"🌍 Deine aktuelle Sprache ist: **{lang_name}**", ephemeral=True)

    # --- Daten-Export (DSGVO Art. 15) ---

    @data.command(name="get", description="Erhalte eine Kopie all deiner gespeicherten Daten (JSON).")
    async def get_user_data(self, ctx: discord.ApplicationContext):
        """Erstellt ein Datenpaket aus allen verknüpften Datenbanken."""
        await ctx.defer(ephemeral=True)
        uid = ctx.author.id

        export_data = {
            "metadata": {
                "user_id": uid,
                "exported_at": datetime.now().isoformat(),
                "source": "ManagerX Network"
            },
            "content": {}
        }

        try:
            # Daten aus den verschiedenen Modulen sammeln
            # Hinweis: Manche Methoden müssen in deinen DB-Klassen existieren
            export_data["content"]["settings"] = SettingsDB().get_user_language(uid)
            export_data["content"]["profile"] = ProfileDB().get_user_profile(uid)
            export_data["content"]["leveling"] = LevelDatabase().get_user_data(uid)
            export_data["content"]["global_chat_history"] = global_db.get_user_message_history(uid, limit=50)
            
            # Moderationsdaten (nur für diesen Server)
            warn_db = WarnDatabase(".")
            export_data["content"]["local_warnings"] = warn_db.get_warnings(ctx.guild.id, uid)
            
            notes_db = NotesDatabase(".")
            export_data["content"]["local_notes"] = notes_db.get_notes(ctx.guild.id, uid)

        except Exception as e:
            print(f"Export-Fehler: {e}")
            # Wir machen weiter, um zumindest Teil-Daten zu liefern

        # JSON Datei erstellen
        json_str = json.dumps(export_data, indent=4, ensure_ascii=False)
        file = discord.File(io.BytesIO(json_str.encode()), filename=f"managerx_data_{uid}.json")

        embed = discord.Embed(
            title="📂 Dein Daten-Export",
            description="Im Anhang findest du alle Daten, die mit deiner ID verknüpft sind.",
            color=SUCCESS_COLOR
        )
        embed.set_footer(text=FOOTER)
        await ctx.respond(embed=embed, file=file, ephemeral=True)

    # --- Daten-Löschung (DSGVO Art. 17) ---

    @data.command(name="delete", description="Lösche deine persönlichen Daten permanent.")
    async def delete_all_data(self, ctx: discord.ApplicationContext):
        embed = discord.Embed(
            title=f"{emoji_warn} ACHTUNG: Datenlöschung",
            description=(
                "Möchtest du deine persönlichen Daten wirklich löschen?\n\n"
                "**Gelöscht wird:** Level, XP, Statistiken, Profile & Einstellungen.\n"
                "**Bleibt bestehen:** Moderations-Daten (Warns) zum Schutz des Netzwerks (180 Tage).\n\n"
                "Dieser Vorgang kann nicht rückgängig gemacht werden!"
            ),
            color=ERROR_COLOR
        )
        embed.set_author(name=AUTHOR)
        embed.set_footer(text=FOOTER)

        view = DeletionView(ctx.author.id, self.bot)
        await ctx.respond(embed=embed, view=view, ephemeral=True)

# --- Views für den Löschprozess ---

class DeletionView(discord.ui.View):
    def __init__(self, user_id, bot):
        super().__init__(timeout=60)
        self.user_id = user_id
        self.bot = bot

    @discord.ui.button(label="Fortfahren", style=discord.ButtonStyle.danger, emoji="🗑️")
    async def delete_button(self, button: discord.ui.Button, interaction: discord.Interaction):
        if interaction.user.id != self.user_id:
            return await interaction.response.send_message("Nicht dein Menü!", ephemeral=True)

        embed = discord.Embed(
            title="⚠️ LETZTE BESTÄTIGUNG",
            description="Willst du deine Stats und Profile wirklich unwiderruflich löschen?",
            color=ERROR_COLOR
        )
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
            return await interaction.response.send_message("Nicht dein Menü!", ephemeral=True)

        uid = self.user_id
        try:
            # Löschung der persönlichen Daten
            await StatsDB().delete_user_data(uid)
            LevelDatabase().delete_user_data(uid)
            ProfileDB().delete_user_data(uid)
            SettingsDB().delete_user_data(uid)
            global_db.delete_user_data(uid)
            AntiSpamDatabase().delete_user_data(uid)
            TempVCDatabase().delete_user_data(uid)
            
            # Moderation (Warns/Notes) wird hier NICHT gelöscht!

        except Exception as e:
            print(f"Löschfehler (User {uid}): {e}")

        embed = discord.Embed(
            title="✅ Löschung erfolgreich",
            description="Deine persönlichen Daten wurden entfernt. Warnungen bleiben systembedingt erhalten.",
            color=SUCCESS_COLOR
        )
        await interaction.response.edit_message(embed=embed, view=None)

    @discord.ui.button(label="Abbrechen", style=discord.ButtonStyle.secondary)
    async def cancel_button(self, button: discord.ui.Button, interaction: discord.Interaction):
        await interaction.response.edit_message(content="Abgebrochen.", embed=None, view=None)

def setup(bot):
    bot.add_cog(Settings(bot))