import discord
from discord import SlashCommandGroup
import ezcord
from discord.ui import Container, View, Button
import sys
import os
import psutil
import platform
from datetime import datetime
import asyncio
from pathlib import Path
import math
import subprocess

ALLOWED_IDS = [1427994077332373554]

class ServerListView(View):
    def __init__(self, guilds, page=0, per_page=20):
        super().__init__(timeout=180)  # 3 Minuten Timeout
        self.guilds = guilds
        self.page = page
        self.per_page = per_page
        self.max_pages = math.ceil(len(guilds) / per_page)
        
        self.update_buttons()
    
    def update_buttons(self):
        # Entferne alle Buttons
        self.clear_items()
        
        # Erste Seite Button
        first_button = Button(
            label="⏮️",
            style=discord.ButtonStyle.gray,
            disabled=(self.page == 0)
        )
        first_button.callback = self.first_page
        self.add_item(first_button)
        
        # Vorherige Seite Button
        prev_button = Button(
            label="◀️",
            style=discord.ButtonStyle.primary,
            disabled=(self.page == 0)
        )
        prev_button.callback = self.previous_page
        self.add_item(prev_button)
        
        # Seiten-Anzeige (deaktivierter Button)
        page_button = Button(
            label=f"Seite {self.page + 1}/{self.max_pages}",
            style=discord.ButtonStyle.gray,
            disabled=True
        )
        self.add_item(page_button)
        
        # Nächste Seite Button
        next_button = Button(
            label="▶️",
            style=discord.ButtonStyle.primary,
            disabled=(self.page >= self.max_pages - 1)
        )
        next_button.callback = self.next_page
        self.add_item(next_button)
        
        # Letzte Seite Button
        last_button = Button(
            label="⏭️",
            style=discord.ButtonStyle.gray,
            disabled=(self.page >= self.max_pages - 1)
        )
        last_button.callback = self.last_page
        self.add_item(last_button)
    
    def get_page_container(self):
        start = self.page * self.per_page
        end = start + self.per_page
        page_guilds = self.guilds[start:end]
        
        guilds_text = "\n".join([
            f"**{i + start + 1}.** {guild.name}\n`ID: {guild.id}` • {guild.member_count:,} Mitglieder"
            for i, guild in enumerate(page_guilds)
        ])
        
        container = Container(color=discord.Color.blue())
        container.add_text(f"# 🌐 Server-Liste (Seite {self.page + 1}/{self.max_pages})")
        container.add_separator()
        container.add_text(guilds_text if guilds_text else "*Keine Server auf dieser Seite*")
        container.add_separator()
        container.add_text(f"**Gesamt:** {len(self.guilds):,} Server • **Zeige:** {start + 1}-{min(end, len(self.guilds))}")
        
        return container
    
    async def first_page(self, interaction: discord.Interaction):
        self.page = 0
        self.update_buttons()
        await interaction.response.edit_message(
            view=discord.ui.DesignerView(self.get_page_container(), view=self, timeout=180)
        )
    
    async def previous_page(self, interaction: discord.Interaction):
        self.page = max(0, self.page - 1)
        self.update_buttons()
        await interaction.response.edit_message(
            view=discord.ui.DesignerView(self.get_page_container(), view=self, timeout=180)
        )
    
    async def next_page(self, interaction: discord.Interaction):
        self.page = min(self.max_pages - 1, self.page + 1)
        self.update_buttons()
        await interaction.response.edit_message(
            view=discord.ui.DesignerView(self.get_page_container(), view=self, timeout=180)
        )
    
    async def last_page(self, interaction: discord.Interaction):
        self.page = self.max_pages - 1
        self.update_buttons()
        await interaction.response.edit_message(
            view=discord.ui.DesignerView(self.get_page_container(), view=self, timeout=180)
        )
    
    async def on_timeout(self):
        # Deaktiviere alle Buttons nach Timeout
        for item in self.children:
            item.disabled = True

class admin(ezcord.Cog, hidden=True):
    def __init__(self, bot):
        self.bot = bot
        self.start_time = datetime.now()
        self.cogs_path = Path("src/bot/cogs")

    admin = SlashCommandGroup("admin", "Admin commands")
    bot = admin.create_subgroup("bot", "Bot commands")
    system = admin.create_subgroup("system", "System commands")
    server = admin.create_subgroup("server", "Server management commands")

    async def cog_check(self, ctx):
        if ctx.author.id not in ALLOWED_IDS:
            await ctx.respond("Zugriff verweigert: Deine ID ist nicht autorisiert.", ephemeral=True)
            return False
        return True

    def get_all_cogs(self):
        """Scannt das Cogs-Verzeichnis und gibt alle verfügbaren Cogs zurück"""
        cogs = []
        if not self.cogs_path.exists():
            return cogs
        
        for category_dir in self.cogs_path.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith('_'):
                for cog_file in category_dir.glob('*.py'):
                    if not cog_file.name.startswith('_'):
                        # Format: category.cogname
                        cog_path = f"{category_dir.name}.{cog_file.stem}"
                        cogs.append(cog_path)
        
        return sorted(cogs)

    def format_cog_path(self, cog_input: str):
        """Formatiert den Cog-Pfad korrekt"""
        # Wenn bereits im Format "category.cog", direkt verwenden
        if '.' in cog_input:
            category, cog_name = cog_input.split('.', 1)
            return f"src.bot.cogs.{category}.{cog_name}"
        
        # Ansonsten nach dem Cog in allen Kategorien suchen
        for category_dir in self.cogs_path.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith('_'):
                cog_file = category_dir / f"{cog_input}.py"
                if cog_file.exists():
                    return f"src.bot.cogs.{category_dir.name}.{cog_input}"
        
        # Fallback
        return f"src.bot.cogs.{cog_input}"

    # ===== SYSTEM COMMANDS =====
    
    @system.command(name="shutdown", description="Stoppt den Bot-Prozess")
    async def shutdown(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.red())
        container.add_text("# ⚠️ ManagerX wird heruntergefahren...")
        container.add_separator()
        container.add_text("Dies kann ein paar Sekunden dauern.")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        await self.bot.close()
        sys.exit()

    @system.command(name="restart", description="Startet den Bot neu")
    async def restart(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.orange())
        container.add_text("# 🔄 ManagerX wird neugestartet...")
        container.add_separator()
        container.add_text("Der Bot sollte in wenigen Sekunden wieder online sein.")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        await self.bot.close()
        os.execv(sys.executable, ['python'] + sys.argv)

    @system.command(name="info", description="Zeigt System-Informationen an")
    async def system_info(self, ctx: discord.ApplicationContext):
        # CPU Informationen
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count_physical = psutil.cpu_count(logical=False) or "N/A"
        cpu_count_logical = psutil.cpu_count(logical=True) or "N/A"
        cpu_freq = psutil.cpu_freq()
        
        # RAM Informationen
        ram = psutil.virtual_memory()
        ram_used = ram.used / (1024 ** 3)
        ram_total = ram.total / (1024 ** 3)
        ram_percent = ram.percent
        ram_available = ram.available / (1024 ** 3)
        
        # Disk Informationen - Dynamisch für Windows und Linux
        # Nutze os.path.abspath(os.sep) für das System-Laufwerk
        disk_path = os.path.abspath(os.sep)
        try:
            disk = psutil.disk_usage(disk_path)
            disk_used_str = f"{disk.used / (1024 ** 3):.2f} GB"
            disk_total_str = f"{disk.total / (1024 ** 3):.2f} GB"
            disk_percent = disk.percent
            disk_free_str = f"{disk.free / (1024 ** 3):.2f} GB"
        except Exception:
            disk_used_str = "N/A"
            disk_total_str = "N/A"
            disk_percent = 0
            disk_free_str = "N/A"
        
        # Pfad für die Anzeige formatieren (Forward Slashes verhindern Markdown-Escaping auf Windows)
        display_path = disk_path.replace("\\", "/")

        # Uptime berechnen
        uptime = datetime.now() - self.start_time
        days = uptime.days
        hours, remainder = divmod(uptime.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        # CPU Frequenz formatieren
        cpu_freq_current = f"{cpu_freq.current:.0f} MHz" if cpu_freq else "N/A"
        cpu_freq_max = f"{cpu_freq.max:.0f} MHz" if cpu_freq and cpu_freq.max > 0 else "N/A"

        container = Container(color=discord.Color.blue())
        container.add_text("# 🖥️ System-Informationen")
        container.add_separator()
        
        # Betriebssystem
        container.add_text("## 💻 Betriebssystem")
        container.add_text(f"**OS:** {platform.system()} ({platform.release()})")
        container.add_text(f"**Version:** {platform.version()}")
        container.add_text(f"**Architektur:** {platform.machine()}")
        container.add_text(f"**Python:** {platform.python_version()}")
        container.add_text(f"**Py-cord:** {discord.__version__}")
        
        # CPU Modell ermitteln (speziell für Linux/vServer)
        def get_cpu_model():
            try:
                cmd = "cat /proc/cpuinfo | grep 'model name' | head -n 1 | cut -d ':' -f 2"
                model = subprocess.check_output(cmd, shell=True).decode().strip()
                return model if model else platform.processor()
            except:
                # Fallback für Windows oder wenn cat/grep fehlt
                if platform.system() == "Windows":
                    return platform.processor()
                return "AMD Ryzen 9 7900" # User-Wunsch Fallback

        cpu_model = get_cpu_model()

        # CPU Informationen
        container.add_text("## ⚙️ CPU")
        container.add_text(f"**Prozessor:** {cpu_model or 'Unbekannt'}")
        container.add_text(f"**Kerne:** {cpu_count_physical} Physisch, {cpu_count_logical} Logisch")
        container.add_text(f"**Frequenz:** {cpu_freq_current} (Max: {cpu_freq_max})")
        
        # CPU Auslastungs-Balken
        cpu_bar = "█" * int(cpu_percent / 10) + "░" * (10 - int(cpu_percent / 10))
        container.add_text(f"**Auslastung:** `{cpu_bar}` {cpu_percent}%")
        
        container.add_separator()
        
        # RAM Informationen
        container.add_text("## 🧠 Arbeitsspeicher (RAM)")
        container.add_text(f"**Gesamt:** {ram_total:.2f} GB")
        container.add_text(f"**Verwendet:** {ram_used:.2f} GB ({ram_percent}%)")
        container.add_text(f"**Verfügbar:** {ram_available:.2f} GB")
        
        # RAM Auslastungs-Balken
        ram_bar = "█" * int(ram_percent / 10) + "░" * (10 - int(ram_percent / 10))
        container.add_text(f"`{ram_bar}` {ram_percent}%")
        
        container.add_separator()
        
        # Disk Informationen
        container.add_text("## 💾 Festplatte")
        container.add_text(f"**Pfad:** `{display_path}`")
        container.add_text(f"**Gesamt:** {disk_total_str}")
        container.add_text(f"**Verwendet:** {disk_used_str} ({disk_percent}%)")
        container.add_text(f"**Frei:** {disk_free_str}")
        
        # Disk Auslastungs-Balken
        disk_bar = "█" * int(disk_percent / 10) + "░" * (10 - int(disk_percent / 10))
        container.add_text(f"`{disk_bar}` {disk_percent}%")
        
        container.add_separator()
        
        # Uptime
        container.add_text("## ⏱️ Bot-Uptime")
        container.add_text(f"**Laufzeit:** {days}d {hours}h {minutes}m {seconds}s")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    # ===== BOT COMMANDS =====

    @bot.command(name="sync", description="Synchronisiert alle Slash-Commands")
    async def sync(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.blue())
        container.add_text("## 🔄 Synchronisierung...")
        container.add_text("Befehle werden an die Discord API übertragen.")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

        try:
            await self.bot.sync_commands()
            
            container = Container(color=discord.Color.green())
            container.add_separator()
            container.add_text("✅ **Erfolgreich synchronisiert!**")
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_separator()
            container.add_text("## ❌ Synchronisierung fehlgeschlagen!")
            container.add_text(f"```py\n{e}\n```") 
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

    @bot.command(name="stats", description="Zeigt Bot-Statistiken an")
    async def stats(self, ctx: discord.ApplicationContext):
        # Bot Statistiken sammeln
        guild_count = len(self.bot.guilds)
        user_count = sum(guild.member_count for guild in self.bot.guilds)
        text_channels = sum(len(guild.text_channels) for guild in self.bot.guilds)
        voice_channels = sum(len(guild.voice_channels) for guild in self.bot.guilds)
        
        # Latenz
        latency = round(self.bot.latency * 1000, 2)

        container = Container(color=discord.Color.green())
        container.add_text("# 📊 Bot-Statistiken")
        container.add_separator()
        container.add_text(f"**Server:** {guild_count}")
        container.add_text(f"**Benutzer:** {user_count:,}")
        container.add_text(f"**Textkanäle:** {text_channels}")
        container.add_text(f"**Sprachkanäle:** {voice_channels}")
        container.add_separator()
        container.add_text(f"**Latenz:** {latency} ms")
        container.add_text(f"**Geladene Cogs:** {len(self.bot.cogs)}")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @bot.command(name="reload", description="Lädt einen Cog neu")
    async def reload_cog(self, ctx: discord.ApplicationContext, cog: str):
        container = Container(color=discord.Color.blue())
        container.add_text(f"## 🔄 Lade `{cog}` neu...")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

        try:
            cog_path = self.format_cog_path(cog)
            self.bot.reload_extension(cog_path)
            
            container = Container(color=discord.Color.green())
            container.add_separator()
            container.add_text(f"✅ **`{cog}` erfolgreich neu geladen!**")
            container.add_text(f"*Pfad: `{cog_path}`*")
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_separator()
            container.add_text(f"## ❌ Fehler beim Neuladen von `{cog}`!")
            container.add_text(f"```py\n{e}\n```")
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

    @bot.command(name="load", description="Lädt einen Cog")
    async def load_cog(self, ctx: discord.ApplicationContext, cog: str):
        container = Container(color=discord.Color.blue())
        container.add_text(f"## 📥 Lade `{cog}`...")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

        try:
            cog_path = self.format_cog_path(cog)
            self.bot.load_extension(cog_path)
            
            container = Container(color=discord.Color.green())
            container.add_separator()
            container.add_text(f"✅ **`{cog}` erfolgreich geladen!**")
            container.add_text(f"*Pfad: `{cog_path}`*")
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_separator()
            container.add_text(f"## ❌ Fehler beim Laden von `{cog}`!")
            container.add_text(f"```py\n{e}\n```")
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

    @bot.command(name="unload", description="Entlädt einen Cog")
    async def unload_cog(self, ctx: discord.ApplicationContext, cog: str):
        if cog.lower() == "admin" or "admin" in cog.lower():
            container = Container(color=discord.Color.red())
            container.add_text("## ❌ Fehler!")
            container.add_text("Der Admin-Cog kann nicht entladen werden.")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return

        container = Container(color=discord.Color.blue())
        container.add_text(f"## 📤 Entlade `{cog}`...")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

        try:
            cog_path = self.format_cog_path(cog)
            self.bot.unload_extension(cog_path)
            
            container = Container(color=discord.Color.green())
            container.add_separator()
            container.add_text(f"✅ **`{cog}` erfolgreich entladen!**")
            container.add_text(f"*Pfad: `{cog_path}`*")
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_separator()
            container.add_text(f"## ❌ Fehler beim Entladen von `{cog}`!")
            container.add_text(f"```py\n{e}\n```")
            
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

    @bot.command(name="list_cogs", description="Listet alle geladenen Cogs auf")
    async def list_cogs(self, ctx: discord.ApplicationContext):
        loaded_cogs = list(self.bot.cogs.keys())
        loaded_cogs_text = "\n".join([f"✅ `{cog}`" for cog in loaded_cogs])
        
        container = Container(color=discord.Color.blue())
        container.add_text("# 📦 Geladene Cogs")
        container.add_separator()
        container.add_text(loaded_cogs_text if loaded_cogs_text else "*Keine Cogs geladen*")
        container.add_separator()
        container.add_text(f"**Gesamt:** {len(loaded_cogs)}")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @bot.command(name="available_cogs", description="Zeigt alle verfügbaren Cogs an")
    async def available_cogs(self, ctx: discord.ApplicationContext):
        available = self.get_all_cogs()
        loaded = [ext.replace('src.bot.cogs.', '') for ext in self.bot.extensions.keys()]
        
        # Gruppiere nach Kategorien
        categories = {}
        for cog in available:
            category = cog.split('.')[0]
            if category not in categories:
                categories[category] = []
            
            cog_name = cog.split('.')[1]
            status = "✅" if cog in loaded else "⭕"
            categories[category].append(f"{status} `{cog_name}`")
        
        # Erstelle Ausgabe
        output = []
        for category, cogs in sorted(categories.items()):
            output.append(f"**__{category.upper()}__**")
            output.extend(cogs)
            output.append("")  # Leerzeile
        
        container = Container(color=discord.Color.blue())
        container.add_text("# 📚 Verfügbare Cogs")
        container.add_separator()
        container.add_text("\n".join(output) if output else "*Keine Cogs gefunden*")
        container.add_separator()
        container.add_text(f"**Verfügbar:** {len(available)} | **Geladen:** {len(loaded)}")
        container.add_text("\n✅ = Geladen | ⭕ = Nicht geladen")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @bot.command(name="reload_all", description="Lädt alle Cogs neu")
    async def reload_all(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.blue())
        container.add_text("## 🔄 Lade alle Cogs neu...")
        container.add_text("Dies kann einen Moment dauern.")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

        success = []
        failed = []
        
        # Liste aller geladenen Extensions (außer admin)
        extensions = [ext for ext in list(self.bot.extensions.keys()) if 'admin' not in ext.lower()]
        
        for ext in extensions:
            try:
                self.bot.reload_extension(ext)
                success.append(ext.replace('src.bot.cogs.', ''))
            except Exception as e:
                failed.append(f"{ext.replace('src.bot.cogs.', '')}: {str(e)[:50]}")

        # Ergebnis anzeigen
        result_text = []
        
        if success:
            result_text.append("**✅ Erfolgreich neu geladen:**")
            result_text.extend([f"• `{cog}`" for cog in success])
        
        if failed:
            result_text.append("\n**❌ Fehlgeschlagen:**")
            result_text.extend([f"• `{cog}`" for cog in failed])

        container = Container(color=discord.Color.green() if not failed else discord.Color.orange())
        container.add_separator()
        container.add_text("# 🔄 Reload abgeschlossen!")
        container.add_separator()
        container.add_text("\n".join(result_text))
        container.add_separator()
        container.add_text(f"**Erfolgreich:** {len(success)} | **Fehlgeschlagen:** {len(failed)}")
        
        await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

    # ===== SERVER COMMANDS =====

    @server.command(name="leave", description="Verlässt einen Server")
    async def leave_server(self, ctx: discord.ApplicationContext, guild_id: str):
        try:
            guild = self.bot.get_guild(int(guild_id))
            if guild is None:
                container = Container(color=discord.Color.red())
                container.add_text("## ❌ Server nicht gefunden!")
                container.add_text(f"Kein Server mit der ID `{guild_id}` gefunden.")
                await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
                return

            guild_name = guild.name
            await guild.leave()

            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Server verlassen!")
            container.add_text(f"Erfolgreich **{guild_name}** (`{guild_id}`) verlassen.")
            
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_text("## ❌ Fehler!")
            container.add_text(f"```py\n{e}\n```")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @server.command(name="list", description="Listet alle Server auf")
    async def list_servers(self, ctx: discord.ApplicationContext):
        guilds = sorted(self.bot.guilds, key=lambda g: g.member_count, reverse=True)
        
        # Wenn weniger als 20 Server, normale Anzeige
        if len(guilds) <= 20:
            guilds_text = "\n".join([
                f"**{i + 1}.** {guild.name}\n`ID: {guild.id}` • {guild.member_count:,} Mitglieder"
                for i, guild in enumerate(guilds)
            ])

            container = Container(color=discord.Color.blue())
            container.add_text("# 🌐 Server-Liste")
            container.add_separator()
            container.add_text(guilds_text if guilds_text else "*Keine Server*")
            container.add_separator()
            container.add_text(f"**Gesamt:** {len(guilds)} Server")
            
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        # Wenn mehr als 20 Server, Pagination verwenden
        else:
            pagination_view = ServerListView(guilds, page=0, per_page=20)
            container = pagination_view.get_page_container()
            
            await ctx.respond(
                view=discord.ui.DesignerView(container, view=pagination_view, timeout=180),
                ephemeral=True
            )

    # ===== TEST COMMAND =====

    @bot.command(name="test", description="Testet die Bot-Funktionalität")
    async def test(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.blue())
        container.add_text("## 🔄 Test wird ausgeführt...")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        # Simuliere eine kurze Verzögerung
        await asyncio.sleep(1)
        
        container = Container(color=discord.Color.green())
        container.add_text("# ✅ Test erfolgreich!")
        container.add_separator()
        container.add_text(f"**Bot Status:** Online")
        container.add_text(f"**Latenz:** {round(self.bot.latency * 1000, 2)} ms")
        container.add_text(f"**Befehl ausgeführt von:** {ctx.author.mention}")
        
        await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

def setup(bot):
    bot.add_cog(admin(bot))