import discord
from discord import SlashCommandGroup, Option
import ezcord
from discord.ui import Container, View, Button, Modal, InputText
import sys
import os
import psutil
import platform
from datetime import datetime
import asyncio
from pathlib import Path
import math
import subprocess
import json
from typing import Optional, List
import time

ALLOWED_IDS = [1427994077332373554]

# Audit Log Storage
AUDIT_LOG_FILE = Path("data/admin_audit.json")
BLACKLIST_FILE = Path("data/blacklist.json")




class ServerListView:
    """Pagination für Server-Liste mit DesignerView"""
    def __init__(self, guilds, bot, page=0, per_page=20, sort_by="members", filter_text=""):
        self.all_guilds = guilds
        self.bot = bot
        self.page = page
        self.per_page = per_page
        self.sort_by = sort_by
        self.filter_text = filter_text.lower()
        
        # Filtern
        if self.filter_text:
            self.guilds = [g for g in guilds if self.filter_text in g.name.lower()]
        else:
            self.guilds = guilds
        
        # Sortieren
        if sort_by == "members":
            self.guilds = sorted(self.guilds, key=lambda g: g.member_count, reverse=True)
        elif sort_by == "name":
            self.guilds = sorted(self.guilds, key=lambda g: g.name.lower())
        elif sort_by == "joined":
            self.guilds = sorted(self.guilds, key=lambda g: g.me.joined_at, reverse=True)
        
        self.max_pages = math.ceil(len(self.guilds) / per_page) if self.guilds else 1

    def get_designer_view(self):
        """Erstellt eine komplette DesignerView mit Container und Buttons"""
        start = self.page * self.per_page
        end = start + self.per_page
        page_guilds = self.guilds[start:end] if self.guilds else []
        
        guilds_list = []
        for i, guild in enumerate(page_guilds):
            name = guild.name[:35] + "..." if len(guild.name) > 35 else guild.name
            members = f"{guild.member_count:,}".replace(",", ".")
            
            boost_emoji = ""
            if guild.premium_tier == 3:
                boost_emoji = "💎"
            elif guild.premium_tier == 2:
                boost_emoji = "💠"
            elif guild.premium_tier == 1:
                boost_emoji = "🔷"
            
            verified_emoji = "✅" if guild.verification_level == discord.VerificationLevel.high else ""
            partner_emoji = "🤝" if "PARTNERED" in guild.features else ""
            status_icons = f"{boost_emoji}{verified_emoji}{partner_emoji}".strip()
            
            guilds_list.append(f"`{i + start + 1:3}.` **{name}** {status_icons}")
            guilds_list.append(f" ID: `{guild.id}` │ 👥 {members}")
        
        guilds_text = "\n".join(guilds_list) if guilds_list else "*Keine Server gefunden*"
        
        filter_info = f" (Filter: `{self.filter_text}`)" if self.filter_text else ""
        sort_name = {"members": "Mitglieder", "name": "Name", "joined": "Beitritt"}[self.sort_by]
        
        container = Container(color=discord.Color.blue())
        container.add_text(f"# 🌐 Server-Liste{filter_info}")
        container.add_separator()
        container.add_text(guilds_text)
        container.add_separator()
        container.add_text(f"📊 **Seite {self.page + 1}/{self.max_pages}** │ Zeige {start + 1}-{min(end, len(self.guilds))} von {len(self.guilds):,} Servern")
        container.add_text(f"🔀 **Sortierung:** {sort_name} │ 💎 = Level 3, 💠 = Level 2, 🔷 = Level 1")
        
        # Erstelle DesignerView
        view = discord.ui.DesignerView(container, timeout=180)
        
        # Navigation Buttons (erste Reihe) - ActionRow
        nav_row = discord.ui.ActionRow()
        
        first_button = Button(
            label="⏮️",
            style=discord.ButtonStyle.gray,
            disabled=(self.page == 0),
            custom_id=f"first_{self.page}"
        )
        first_button.callback = self.make_callback("first")
        nav_row.add_item(first_button)
        
        prev_button = Button(
            label="◀️",
            style=discord.ButtonStyle.primary,
            disabled=(self.page == 0),
            custom_id=f"prev_{self.page}"
        )
        prev_button.callback = self.make_callback("prev")
        nav_row.add_item(prev_button)
        
        page_button = Button(
            label=f"Seite {self.page + 1}/{self.max_pages}",
            style=discord.ButtonStyle.gray,
            disabled=True,
            custom_id=f"page_{self.page}"
        )
        nav_row.add_item(page_button)
        
        next_button = Button(
            label="▶️",
            style=discord.ButtonStyle.primary,
            disabled=(self.page >= self.max_pages - 1),
            custom_id=f"next_{self.page}"
        )
        next_button.callback = self.make_callback("next")
        nav_row.add_item(next_button)
        
        last_button = Button(
            label="⏭️",
            style=discord.ButtonStyle.gray,
            disabled=(self.page >= self.max_pages - 1),
            custom_id=f"last_{self.page}"
        )
        last_button.callback = self.make_callback("last")
        nav_row.add_item(last_button)
        
        view.add_item(nav_row)
        
        # Sortierung Buttons (zweite Reihe) - ActionRow
        sort_row = discord.ui.ActionRow()
        
        sort_members = Button(
            label="👥 Mitglieder",
            style=discord.ButtonStyle.success if self.sort_by == "members" else discord.ButtonStyle.secondary,
            custom_id=f"sort_members_{self.page}"
        )
        sort_members.callback = self.make_callback("sort_members")
        sort_row.add_item(sort_members)
        
        sort_name_btn = Button(
            label="📝 Name",
            style=discord.ButtonStyle.success if self.sort_by == "name" else discord.ButtonStyle.secondary,
            custom_id=f"sort_name_{self.page}"
        )
        sort_name_btn.callback = self.make_callback("sort_name")
        sort_row.add_item(sort_name_btn)
        
        sort_joined = Button(
            label="📅 Beitritt",
            style=discord.ButtonStyle.success if self.sort_by == "joined" else discord.ButtonStyle.secondary,
            custom_id=f"sort_joined_{self.page}"
        )
        sort_joined.callback = self.make_callback("sort_joined")
        sort_row.add_item(sort_joined)
        
        # Export Button
        export_button = Button(
            label="💾 Export",
            style=discord.ButtonStyle.primary,
            custom_id=f"export_{self.page}"
        )
        export_button.callback = self.make_callback("export")
        sort_row.add_item(export_button)
        
        view.add_item(sort_row)
        
        return view

    def make_callback(self, action):
        """Erstellt eine Callback-Funktion für Button-Actions"""
        async def callback(interaction: discord.Interaction):
            # Navigation
            if action == "first":
                self.page = 0
            elif action == "prev":
                self.page = max(0, self.page - 1)
            elif action == "next":
                self.page = min(self.max_pages - 1, self.page + 1)
            elif action == "last":
                self.page = self.max_pages - 1
            
            # Sortierung
            elif action == "sort_members":
                self.sort_by = "members"
                self.page = 0
                self.guilds = sorted(self.guilds, key=lambda g: g.member_count, reverse=True)
            elif action == "sort_name":
                self.sort_by = "name"
                self.page = 0
                self.guilds = sorted(self.guilds, key=lambda g: g.name.lower())
            elif action == "sort_joined":
                self.sort_by = "joined"
                self.page = 0
                self.guilds = sorted(self.guilds, key=lambda g: g.me.joined_at, reverse=True)
            
            # Export
            elif action == "export":
                await self.export_data(interaction)
                return
            
            # Update View
            new_view = self.get_designer_view()
            await interaction.response.edit_message(view=new_view)
        
        return callback

    async def export_data(self, interaction: discord.Interaction):
        """Exportiert Server-Daten als JSON"""
        await interaction.response.defer()
        
        export_data = []
        for guild in self.guilds:
            export_data.append({
                "name": guild.name,
                "id": str(guild.id),
                "members": guild.member_count,
                "boost_level": guild.premium_tier,
                "boosts": guild.premium_subscription_count,
                "joined": guild.me.joined_at.isoformat() if guild.me.joined_at else None,
                "features": guild.features
            })
        
        filename = f"server_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = Path("data/exports") / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        container = Container(color=discord.Color.green())
        container.add_text("## ✅ Export erfolgreich!")
        container.add_text(f"**Datei:** `{filename}`")
        container.add_text(f"**Anzahl:** {len(export_data)} Server")
        
        await interaction.followup.send(
            view=discord.ui.DesignerView(container, timeout=0),
            ephemeral=True
        )


class admin(ezcord.Cog, hidden=True):
    def __init__(self, bot):
        self.bot = bot
        self.start_time = datetime.now()
        self.cogs_path = Path("src/bot/cogs")
        self.data_path = Path("data")
        self.data_path.mkdir(exist_ok=True)
        
        # Lade Blacklist
        self.blacklist = self.load_blacklist()
        
        # Command Counter für Rate Limiting
        self.command_usage = {}

    admin = SlashCommandGroup("admin", "Admin commands")
    bot = admin.create_subgroup("bot", "Bot commands")
    system = admin.create_subgroup("system", "System commands")
    server = admin.create_subgroup("server", "Server management commands")
    user = admin.create_subgroup("user", "User management commands")
    logs = admin.create_subgroup("logs", "Log commands")

    async def cog_check(self, ctx):
        # Sicherheitscheck: IMMER prüfen, auch für Gruppen/Subgruppen
        if ctx.author.id not in ALLOWED_IDS:
            await ctx.respond("❌ Zugriff verweigert: Deine ID ist nicht autorisiert.", ephemeral=True)
            return False
        
        # Nur für Leaf-Commands loggen und Rate-Limiten (nicht für Gruppen/Subgruppen)
        # Das verhindert, dass z.B. "admin logs view" 3x geloggt wird
        is_leaf_command = not hasattr(ctx.command, 'subcommands') or not ctx.command.subcommands
        
        if is_leaf_command:
            # Rate Limiting Check
            user_id = ctx.author.id
            current_time = time.time()
            
            if user_id in self.command_usage:
                last_time, count = self.command_usage[user_id]
                if current_time - last_time < 60:  # 1 Minute
                    if count >= 30:  # Max 30 Commands pro Minute
                        await ctx.respond("⚠️ Rate Limit erreicht. Bitte warte einen Moment.", ephemeral=True)
                        return False
                    self.command_usage[user_id] = (last_time, count + 1)
                else:
                    self.command_usage[user_id] = (current_time, 1)
            else:
                self.command_usage[user_id] = (current_time, 1)
            
            # Audit Log - nur einmal pro echtem Command
            self.log_command(ctx)
        
        return True

    async def request_confirmation(self, ctx: discord.ApplicationContext, container: Container, timeout: int = 30) -> bool:
        """Helper to create a confirmation dialog with buttons and a designer container."""
        view = discord.ui.DesignerView(container, timeout=timeout)
        view.value = None
        
        async def confirm_callback(interaction: discord.Interaction):
            view.value = True
            view.stop()
            await interaction.response.defer()
            
        async def cancel_callback(interaction: discord.Interaction):
            view.value = False
            view.stop()
            await interaction.response.defer()
            
        confirm_btn = Button(label="✅ Bestätigen", style=discord.ButtonStyle.danger)
        confirm_btn.callback = confirm_callback
        
        cancel_btn = Button(label="❌ Abbrechen", style=discord.ButtonStyle.secondary)
        cancel_btn.callback = cancel_callback
        
        view.add_item(confirm_btn)
        view.add_item(cancel_btn)
        
        await ctx.respond(view=view, ephemeral=True)
        await view.wait()
        return view.value if view.value is not None else False

    def log_command(self, ctx):
        """Loggt Admin-Commands"""
        AUDIT_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": str(ctx.author.id),
            "user_name": str(ctx.author),
            "command": ctx.command.qualified_name if ctx.command else "unknown",
            "guild_id": str(ctx.guild.id) if ctx.guild else None,
            "guild_name": ctx.guild.name if ctx.guild else None
        }
        
        logs = []
        if AUDIT_LOG_FILE.exists():
            with open(AUDIT_LOG_FILE, 'r', encoding='utf-8') as f:
                try:
                    logs = json.load(f)
                except:
                    logs = []
        
        logs.append(log_entry)
        
        # Behalte nur die letzten 1000 Einträge
        if len(logs) > 1000:
            logs = logs[-1000:]
        
        with open(AUDIT_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)

    def load_blacklist(self):
        """Lädt die Blacklist"""
        if BLACKLIST_FILE.exists():
            with open(BLACKLIST_FILE, 'r', encoding='utf-8') as f:
                try:
                    return json.load(f)
                except:
                    return {"guilds": [], "users": []}
        return {"guilds": [], "users": []}

    def save_blacklist(self):
        """Speichert die Blacklist"""
        BLACKLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(BLACKLIST_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.blacklist, f, indent=2, ensure_ascii=False)

    def get_all_cogs(self):
        """Scannt das Cogs-Verzeichnis und gibt alle verfügbaren Cogs zurück"""
        cogs = []
        if not self.cogs_path.exists():
            return cogs
        
        for category_dir in self.cogs_path.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith('_'):
                for cog_file in category_dir.glob('*.py'):
                    if not cog_file.name.startswith('_'):
                        cog_path = f"{category_dir.name}.{cog_file.stem}"
                        cogs.append(cog_path)
        
        return sorted(cogs)

    def format_cog_path(self, cog_input: str):
        """Formatiert den Cog-Pfad korrekt"""
        if '.' in cog_input:
            category, cog_name = cog_input.split('.', 1)
            return f"src.bot.cogs.{category}.{cog_name}"
        
        for category_dir in self.cogs_path.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith('_'):
                cog_file = category_dir / f"{cog_input}.py"
                if cog_file.exists():
                    return f"src.bot.cogs.{category_dir.name}.{cog_input}"
        
        return f"src.bot.cogs.{cog_input}"

    async def cog_autocomplete(self, ctx: discord.AutocompleteContext):
        """Autocomplete für Cog-Namen"""
        available_cogs = self.get_all_cogs()
        user_input = ctx.value.lower()
        
        # Filtere basierend auf Eingabe
        filtered = [cog for cog in available_cogs if user_input in cog.lower()]
        return filtered[:25]  # Discord Limit

    # ===== SYSTEM COMMANDS =====
    
    @system.command(name="shutdown", description="Stoppt den Bot-Prozess")
    async def shutdown(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.orange())
        container.add_text("# ⚠️ Shutdown bestätigen")
        container.add_text("Bist du sicher, dass du den Bot herunterfahren möchtest?")
        
        if await self.request_confirmation(ctx, container):
            container = Container(color=discord.Color.red())
            container.add_text("# ⚠️ ManagerX wird heruntergefahren...")
            container.add_separator()
            container.add_text("Dies kann ein paar Sekunden dauern.")
            await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))
            await self.bot.close()
            sys.exit()
        else:
            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Shutdown abgebrochen")
            await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))

    @system.command(name="restart", description="Startet den Bot neu")
    async def restart(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.orange())
        container.add_text("# ⚠️ Restart bestätigen")
        container.add_text("Bist du sicher, dass du den Bot neustarten möchtest?")
        
        if await self.request_confirmation(ctx, container):
            container = Container(color=discord.Color.orange())
            container.add_text("# 🔄 ManagerX wird neugestartet...")
            container.add_separator()
            container.add_text("Der Bot sollte in wenigen Sekunden wieder online sein.")
            await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))
            await self.bot.close()
            os.execv(sys.executable, ['python'] + sys.argv)
        else:
            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Restart abgebrochen")
            await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))

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
        
        # Disk Informationen
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
        
        display_path = disk_path.replace("\\", "/")
        
        # Uptime berechnen
        uptime = datetime.now() - self.start_time
        days = uptime.days
        hours, remainder = divmod(uptime.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        # CPU Frequenz formatieren
        cpu_freq_current = f"{cpu_freq.current:.0f} MHz" if cpu_freq else "N/A"
        cpu_freq_max = f"{cpu_freq.max:.0f} MHz" if cpu_freq and cpu_freq.max > 0 else "N/A"
        
        # Netzwerk Informationen
        try:
            net_io = psutil.net_io_counters()
            bytes_sent = net_io.bytes_sent / (1024 ** 3)
            bytes_recv = net_io.bytes_recv / (1024 ** 3)
            net_info = f"📤 {bytes_sent:.2f} GB │ 📥 {bytes_recv:.2f} GB"
        except:
            net_info = "N/A"
        
        # Prozess Informationen
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info().rss / (1024 ** 2)  # MB
        process_threads = process.num_threads()
        
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
        
        # CPU Modell ermitteln
        def get_cpu_model():
            try:
                cmd = "cat /proc/cpuinfo | grep 'model name' | head -n 1 | cut -d ':' -f 2"
                model = subprocess.check_output(cmd, shell=True).decode().strip()
                return model if model else platform.processor()
            except:
                if platform.system() == "Windows":
                    return platform.processor()
                return "AMD Ryzen 9 7900"
        
        cpu_model = get_cpu_model()
        
        # CPU Informationen
        container.add_text("## ⚙️ CPU")
        container.add_text(f"**Prozessor:** {cpu_model or 'Unbekannt'}")
        container.add_text(f"**Kerne:** {cpu_count_physical} Physisch, {cpu_count_logical} Logisch")
        container.add_text(f"**Frequenz:** {cpu_freq_current} (Max: {cpu_freq_max})")
        cpu_bar = "█" * int(cpu_percent / 10) + "░" * (10 - int(cpu_percent / 10))
        container.add_text(f"**Auslastung:** `{cpu_bar}` {cpu_percent}%")
        container.add_separator()
        
        # RAM Informationen
        container.add_text("## 🧠 Arbeitsspeicher (RAM)")
        container.add_text(f"**Gesamt:** {ram_total:.2f} GB")
        container.add_text(f"**Verwendet:** {ram_used:.2f} GB ({ram_percent}%)")
        container.add_text(f"**Verfügbar:** {ram_available:.2f} GB")
        ram_bar = "█" * int(ram_percent / 10) + "░" * (10 - int(ram_percent / 10))
        container.add_text(f"`{ram_bar}` {ram_percent}%")
        container.add_separator()
        
        # Disk Informationen
        container.add_text("## 💾 Festplatte")
        container.add_text(f"**Pfad:** `{display_path}`")
        container.add_text(f"**Gesamt:** {disk_total_str}")
        container.add_text(f"**Verwendet:** {disk_used_str} ({disk_percent}%)")
        container.add_text(f"**Frei:** {disk_free_str}")
        disk_bar = "█" * int(disk_percent / 10) + "░" * (10 - int(disk_percent / 10))
        container.add_text(f"`{disk_bar}` {disk_percent}%")
        container.add_separator()
        
        # Netzwerk & Prozess
        container.add_text("## 🌐 Netzwerk & Prozess")
        container.add_text(f"**Netzwerk-Traffic:** {net_info}")
        container.add_text(f"**Bot-RAM:** {process_memory:.2f} MB")
        container.add_text(f"**Threads:** {process_threads}")
        container.add_text(f"**PID:** {os.getpid()}")
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
        guild_count = len(self.bot.guilds)
        user_count = sum(guild.member_count for guild in self.bot.guilds)
        text_channels = sum(len(guild.text_channels) for guild in self.bot.guilds)
        voice_channels = sum(len(guild.voice_channels) for guild in self.bot.guilds)
        latency = round(self.bot.latency * 1000, 2)
        
        # Zusätzliche Statistiken
        total_roles = sum(len(guild.roles) for guild in self.bot.guilds)
        total_emojis = sum(len(guild.emojis) for guild in self.bot.guilds)
        
        # Durchschnittswerte
        avg_members = user_count // guild_count if guild_count > 0 else 0
        
        # Größter Server
        biggest_guild = max(self.bot.guilds, key=lambda g: g.member_count) if self.bot.guilds else None
        
        container = Container(color=discord.Color.green())
        container.add_text("# 📊 Bot-Statistiken")
        container.add_separator()
        container.add_text(f"**Server:** {guild_count:,}")
        container.add_text(f"**Benutzer:** {user_count:,}")
        container.add_text(f"**Ø Mitglieder/Server:** {avg_members:,}")
        container.add_separator()
        container.add_text(f"**Textkanäle:** {text_channels:,}")
        container.add_text(f"**Sprachkanäle:** {voice_channels:,}")
        container.add_text(f"**Rollen:** {total_roles:,}")
        container.add_text(f"**Emojis:** {total_emojis:,}")
        container.add_separator()
        
        if biggest_guild:
            container.add_text(f"**Größter Server:** {biggest_guild.name}")
            container.add_text(f"**Mitglieder:** {biggest_guild.member_count:,}")
            container.add_separator()
        
        container.add_text(f"**Latenz:** {latency} ms")
        container.add_text(f"**Geladene Cogs:** {len(self.bot.cogs)}")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @bot.command(name="reload", description="Lädt einen Cog neu")
    async def reload_cog(
        self,
        ctx: discord.ApplicationContext,
        cog: Option(str, "Name des Cogs", autocomplete=cog_autocomplete)
    ):
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
    async def load_cog(
        self,
        ctx: discord.ApplicationContext,
        cog: Option(str, "Name des Cogs", autocomplete=cog_autocomplete)
    ):
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
    async def unload_cog(
        self,
        ctx: discord.ApplicationContext,
        cog: Option(str, "Name des Cogs", autocomplete=cog_autocomplete)
    ):
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
        
        # Gruppiere nach Kategorien
        categories = {}
        for ext in self.bot.extensions.keys():
            cog_name = ext.replace('src.bot.cogs.', '')
            if '.' in cog_name:
                category = cog_name.split('.')[0]
                name = cog_name.split('.')[1]
            else:
                category = "Other"
                name = cog_name
            
            if category not in categories:
                categories[category] = []
            categories[category].append(name)
        
        # Erstelle Ausgabe
        output = []
        for category, cogs in sorted(categories.items()):
            output.append(f"**__{category.upper()}__**")
            for cog in sorted(cogs):
                output.append(f"✅ `{cog}`")
            output.append("")
        
        container = Container(color=discord.Color.blue())
        container.add_text("# 📦 Geladene Cogs")
        container.add_separator()
        container.add_text("\n".join(output) if output else "*Keine Cogs geladen*")
        container.add_separator()
        container.add_text(f"**Gesamt:** {len(loaded_cogs)} Cogs in {len(categories)} Kategorien")
        
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
            output.append("")
        
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
        container = Container(color=discord.Color.orange())
        container.add_text("# ⚠️ Reload All bestätigen")
        container.add_text("Alle Cogs (außer Admin) werden neu geladen. Fortfahren?")
        
        if not await self.request_confirmation(ctx, container):
            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Reload abgebrochen")
            await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))
            return
        
        container = Container(color=discord.Color.blue())
        container.add_text("## 🔄 Lade alle Cogs neu...")
        container.add_text("Dies kann einen Moment dauern.")
        await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))
        
        success = []
        failed = []
        
        extensions = [ext for ext in list(self.bot.extensions.keys()) if 'admin' not in ext.lower()]
        
        for ext in extensions:
            try:
                self.bot.reload_extension(ext)
                success.append(ext.replace('src.bot.cogs.', ''))
            except Exception as e:
                failed.append(f"{ext.replace('src.bot.cogs.', '')}: {str(e)[:50]}")
        
        result_text = []
        if success:
            result_text.append("**✅ Erfolgreich neu geladen:**")
            result_text.extend([f"• `{cog}`" for cog in success[:10]])
            if len(success) > 10:
                result_text.append(f"... und {len(success) - 10} weitere")
        
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
        
        await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))

    @bot.command(name="reload_category", description="Lädt alle Cogs einer Kategorie neu")
    async def reload_category(
        self,
        ctx: discord.ApplicationContext,
        category: Option(str, "Kategorie-Name (z.B. 'admin', 'moderation')")
    ):
        container = Container(color=discord.Color.blue())
        container.add_text(f"## 🔄 Lade Kategorie `{category}` neu...")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        success = []
        failed = []
        
        extensions = [ext for ext in list(self.bot.extensions.keys()) if f'.{category}.' in ext.lower()]
        
        if not extensions:
            container = Container(color=discord.Color.red())
            container.add_text(f"## ❌ Keine Cogs in Kategorie `{category}` gefunden!")
            await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))
            return
        
        for ext in extensions:
            try:
                self.bot.reload_extension(ext)
                success.append(ext.replace('src.bot.cogs.', ''))
            except Exception as e:
                failed.append(f"{ext.replace('src.bot.cogs.', '')}: {str(e)[:50]}")
        
        result_text = []
        if success:
            result_text.append("**✅ Erfolgreich:**")
            result_text.extend([f"• `{cog}`" for cog in success])
        
        if failed:
            result_text.append("\n**❌ Fehlgeschlagen:**")
            result_text.extend([f"• `{cog}`" for cog in failed])
        
        container = Container(color=discord.Color.green() if not failed else discord.Color.orange())
        container.add_separator()
        container.add_text(f"# 🔄 Kategorie `{category}` neu geladen!")
        container.add_separator()
        container.add_text("\n".join(result_text))
        
        await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))

    # ===== SERVER COMMANDS =====
    
    @server.command(name="leave", description="Verlässt einen Server")
    async def leave_server(
        self,
        ctx: discord.ApplicationContext,
        guild_id: Option(str, "Server ID")
    ):
        try:
            guild = self.bot.get_guild(int(guild_id))
            if guild is None:
                container = Container(color=discord.Color.red())
                container.add_text("## ❌ Server nicht gefunden!")
                container.add_text(f"Kein Server mit der ID `{guild_id}` gefunden.")
                await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
                return
            
            guild_name = guild.name
            
            # Bestätigung
            container = Container(color=discord.Color.orange())
            container.add_text("# ⚠️ Server verlassen bestätigen")
            container.add_text(f"**Server:** {guild_name}")
            container.add_text(f"**ID:** `{guild_id}`")
            container.add_text(f"**Mitglieder:** {guild.member_count:,}")
            
            if await self.request_confirmation(ctx, container):
                await guild.leave()
                
                container = Container(color=discord.Color.green())
                container.add_text("## ✅ Server verlassen!")
                container.add_text(f"Erfolgreich **{guild_name}** (`{guild_id}`) verlassen.")
                await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))
            else:
                container = Container(color=discord.Color.green())
                container.add_text("## ✅ Abgebrochen")
                await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))
        
        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_text("## ❌ Fehler!")
            container.add_text(f"```py\n{e}\n```")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @server.command(name="list", description="Listet alle Server auf")
    async def list_servers(
        self,
        ctx: discord.ApplicationContext,
        filter: Option(str, "Filter nach Name (optional)", required=False, default="")
    ):
        guilds = list(self.bot.guilds)
        
        if len(guilds) <= 20 and not filter:
            # Einfache Liste ohne Pagination
            guilds = sorted(guilds, key=lambda g: g.member_count, reverse=True)
            guilds_list = []
            
            for i, guild in enumerate(guilds):
                name = guild.name[:35] + "..." if len(guild.name) > 35 else guild.name
                members = f"{guild.member_count:,}".replace(",", ".")
                
                boost_emoji = ""
                if guild.premium_tier == 3:
                    boost_emoji = "💎"
                elif guild.premium_tier == 2:
                    boost_emoji = "💠"
                elif guild.premium_tier == 1:
                    boost_emoji = "🔷"
                
                guilds_list.append(f"`{i + 1:3}.` **{name}** {boost_emoji}")
                guilds_list.append(f" ID: `{guild.id}` │ 👥 {members}")
            
            guilds_text = "\n".join(guilds_list)
            
            container = Container(color=discord.Color.blue())
            container.add_text("# 🌐 Server-Liste")
            container.add_separator()
            container.add_text(guilds_text if guilds_text else "*Keine Server*")
            container.add_separator()
            container.add_text(f"📊 **Gesamt:** {len(guilds)} Server")
            
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        else:
            # Pagination mit DesignerView
            pagination = ServerListView(guilds, self.bot, page=0, per_page=20, filter_text=filter)
            view = pagination.get_designer_view()
            await ctx.respond(view=view, ephemeral=True)

    @server.command(name="info", description="Zeigt detaillierte Informationen zu einem Server")
    async def server_info(
        self,
        ctx: discord.ApplicationContext,
        guild_id: Option(str, "Server ID")
    ):
        try:
            guild = self.bot.get_guild(int(guild_id))
            if guild is None:
                container = Container(color=discord.Color.red())
                container.add_text("## ❌ Server nicht gefunden!")
                await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
                return
            
            # Sammle Informationen
            created_at = guild.created_at.strftime("%d.%m.%Y %H:%M")
            joined_at = guild.me.joined_at.strftime("%d.%m.%Y %H:%M") if guild.me.joined_at else "Unbekannt"
            
            # Channels
            text_count = len(guild.text_channels)
            voice_count = len(guild.voice_channels)
            category_count = len(guild.categories)
            
            # Rollen & Emojis
            role_count = len(guild.roles)
            emoji_count = len(guild.emojis)
            
            # Boost Info
            boost_level = guild.premium_tier
            boost_count = guild.premium_subscription_count
            
            # Verification & Features
            verification = {
                discord.VerificationLevel.none: "Keine",
                discord.VerificationLevel.low: "Niedrig",
                discord.VerificationLevel.medium: "Mittel",
                discord.VerificationLevel.high: "Hoch",
                discord.VerificationLevel.highest: "Höchste"
            }.get(guild.verification_level, "Unbekannt")
            
            features = []
            if "VERIFIED" in guild.features:
                features.append("✅ Verifiziert")
            if "PARTNERED" in guild.features:
                features.append("🤝 Partner")
            if "COMMUNITY" in guild.features:
                features.append("🏘️ Community")
            if "DISCOVERABLE" in guild.features:
                features.append("🔍 Auffindbar")
            
            features_text = " • ".join(features) if features else "Keine besonderen Features"
            
            container = Container(color=discord.Color.blue())
            container.add_text(f"# 🌐 Server-Info: {guild.name}")
            container.add_separator()
            
            container.add_text("## 📋 Allgemein")
            container.add_text(f"**ID:** `{guild.id}`")
            container.add_text(f"**Owner:** {guild.owner.mention if guild.owner else 'Unbekannt'}")
            container.add_text(f"**Erstellt:** {created_at}")
            container.add_text(f"**Beigetreten:** {joined_at}")
            container.add_separator()
            
            container.add_text("## 👥 Mitglieder")
            container.add_text(f"**Gesamt:** {guild.member_count:,}")
            container.add_text(f"**Menschen:** {len([m for m in guild.members if not m.bot]):,}")
            container.add_text(f"**Bots:** {len([m for m in guild.members if m.bot]):,}")
            container.add_separator()
            
            container.add_text("## 📺 Kanäle")
            container.add_text(f"**Text:** {text_count}")
            container.add_text(f"**Voice:** {voice_count}")
            container.add_text(f"**Kategorien:** {category_count}")
            container.add_text(f"**Gesamt:** {len(guild.channels)}")
            container.add_separator()
            
            container.add_text("## 🎨 Weitere Infos")
            container.add_text(f"**Rollen:** {role_count}")
            container.add_text(f"**Emojis:** {emoji_count}/{guild.emoji_limit}")
            container.add_text(f"**Boost Level:** {boost_level} ({boost_count} Boosts)")
            container.add_text(f"**Verifizierung:** {verification}")
            container.add_separator()
            
            container.add_text("## ✨ Features")
            container.add_text(features_text)
            container.add_separator()
            
            # Befehls-Statistiken (NEU)
            if hasattr(self.bot, "stats_db"):
                guild_top = await self.bot.stats_db.get_top_commands(guild.id, 3)
                global_top = await self.bot.stats_db.get_global_top_commands(3)
                
                container.add_text("## 📊 Top 3 Befehle")
                
                if guild_top:
                    gt_text = "\n".join([f"• `/{name}` ({count}x)" for name, count in guild_top])
                    container.add_text(f"**Dieser Server:**\n{gt_text}")
                else:
                    container.add_text("**Dieser Server:** Keine Daten")
                    
                if global_top:
                    glob_text = "\n".join([f"• `/{name}` ({count}x)" for name, count in global_top])
                    container.add_text(f"**Global:**\n{glob_text}")
                else:
                    container.add_text("**Global:** Keine Daten")
            
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_text("## ❌ Fehler!")
            container.add_text(f"```py\n{e}\n```")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    # ===== USER COMMANDS =====
    
    @user.command(name="lookup", description="Findet einen User in allen Servern")
    async def user_lookup(
        self,
        ctx: discord.ApplicationContext,
        user_id: Option(str, "User ID")
    ):
        try:
            user_id_int = int(user_id)
            
            # Suche User in allen Guilds
            found_in = []
            user_obj = None
            
            for guild in self.bot.guilds:
                member = guild.get_member(user_id_int)
                if member:
                    user_obj = member
                    found_in.append({
                        "guild": guild,
                        "joined": member.joined_at,
                        "roles": len(member.roles) - 1,  # -1 für @everyone
                        "nickname": member.nick
                    })
            
            if not found_in:
                # Versuche User zu fetchen
                try:
                    user_obj = await self.bot.fetch_user(user_id_int)
                except:
                    container = Container(color=discord.Color.red())
                    container.add_text("## ❌ User nicht gefunden!")
                    container.add_text(f"Kein User mit der ID `{user_id}` gefunden.")
                    await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
                    return
            
            # Erstelle Ausgabe
            container = Container(color=discord.Color.blue())
            container.add_text(f"# 👤 User Lookup: {user_obj}")
            container.add_separator()
            
            container.add_text("## 📋 User-Info")
            container.add_text(f"**Name:** {user_obj.name}")
            container.add_text(f"**ID:** `{user_obj.id}`")
            container.add_text(f"**Bot:** {'Ja' if user_obj.bot else 'Nein'}")
            container.add_text(f"**Erstellt:** {user_obj.created_at.strftime('%d.%m.%Y %H:%M')}")
            container.add_separator()
            
            if found_in:
                container.add_text(f"## 🌐 Gefunden in {len(found_in)} Server(n)")
                for entry in found_in[:10]:  # Max 10 anzeigen
                    guild = entry['guild']
                    joined = entry['joined'].strftime('%d.%m.%Y') if entry['joined'] else 'Unbekannt'
                    nick = f" (Nick: {entry['nickname']})" if entry['nickname'] else ""
                    container.add_text(f"**{guild.name}**{nick}")
                    container.add_text(f" Beigetreten: {joined} │ Rollen: {entry['roles']}")
                
                if len(found_in) > 10:
                    container.add_text(f"\n... und {len(found_in) - 10} weitere Server")
            else:
                container.add_text("## ℹ️ Nicht in gemeinsamen Servern")
            
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        except ValueError:
            container = Container(color=discord.Color.red())
            container.add_text("## ❌ Ungültige ID!")
            container.add_text("Bitte gib eine gültige User-ID ein.")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        except Exception as e:
            container = Container(color=discord.Color.red())
            container.add_text("## ❌ Fehler!")
            container.add_text(f"```py\n{e}\n```")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @user.command(name="blacklist", description="Fügt einen User zur Blacklist hinzu")
    async def blacklist_user(
        self,
        ctx: discord.ApplicationContext,
        user_id: Option(str, "User ID"),
        reason: Option(str, "Grund", required=False, default="Kein Grund angegeben")
    ):
        user_id_str = str(user_id)
        
        if user_id_str in [u["id"] for u in self.blacklist["users"]]:
            container = Container(color=discord.Color.orange())
            container.add_text("## ⚠️ User bereits auf Blacklist!")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return
        
        self.blacklist["users"].append({
            "id": user_id_str,
            "reason": reason,
            "added_by": str(ctx.author.id),
            "added_at": datetime.now().isoformat()
        })
        self.save_blacklist()
        
        container = Container(color=discord.Color.green())
        container.add_text("## ✅ User zur Blacklist hinzugefügt!")
        container.add_text(f"**User ID:** `{user_id}`")
        container.add_text(f"**Grund:** {reason}")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @user.command(name="unblacklist", description="Entfernt einen User von der Blacklist")
    async def unblacklist_user(
        self,
        ctx: discord.ApplicationContext,
        user_id: Option(str, "User ID")
    ):
        user_id_str = str(user_id)
        
        # Suche den Eintrag
        entry = next((u for u in self.blacklist["users"] if u["id"] == user_id_str), None)
        
        if not entry:
            container = Container(color=discord.Color.orange())
            container.add_text("## ⚠️ User nicht auf Blacklist!")
            container.add_text(f"User `{user_id}` ist nicht auf der Blacklist.")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return
        
        self.blacklist["users"].remove(entry)
        self.save_blacklist()
        
        container = Container(color=discord.Color.green())
        container.add_text("## ✅ User von Blacklist entfernt!")
        container.add_text(f"**User ID:** `{user_id}`")
        container.add_text(f"**Ehemaliger Grund:** {entry.get('reason', 'Unbekannt')}")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @user.command(name="blacklist_list", description="Zeigt alle geblacklisteten User an")
    async def blacklist_list_users(self, ctx: discord.ApplicationContext):
        users = self.blacklist.get("users", [])
        
        if not users:
            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Keine User auf der Blacklist!")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return
        
        entries = []
        for u in users:
            added_at = datetime.fromisoformat(u["added_at"]).strftime("%d.%m.%Y %H:%M") if u.get("added_at") else "Unbekannt"
            entries.append(f"**ID:** `{u['id']}` │ **Grund:** {u.get('reason', '-')} │ {added_at}")
        
        container = Container(color=discord.Color.red())
        container.add_text(f"# 🚫 User-Blacklist ({len(users)})")
        container.add_separator()
        container.add_text("\n".join(entries[:25]))
        if len(entries) > 25:
            container.add_text(f"\n... und {len(entries) - 25} weitere")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @server.command(name="blacklist", description="Fügt einen Server zur Blacklist hinzu")
    async def blacklist_guild(
        self,
        ctx: discord.ApplicationContext,
        guild_id: Option(str, "Server ID"),
        reason: Option(str, "Grund", required=False, default="Kein Grund angegeben"),
        auto_leave: Option(bool, "Automatisch verlassen?", required=False, default=True)
    ):
        guild_id_str = str(guild_id)
        
        if guild_id_str in [g["id"] for g in self.blacklist["guilds"]]:
            container = Container(color=discord.Color.orange())
            container.add_text("## ⚠️ Server bereits auf Blacklist!")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return
        
        self.blacklist["guilds"].append({
            "id": guild_id_str,
            "reason": reason,
            "added_by": str(ctx.author.id),
            "added_at": datetime.now().isoformat()
        })
        self.save_blacklist()
        
        # Optional: Server verlassen
        if auto_leave:
            guild = self.bot.get_guild(int(guild_id))
            if guild:
                await guild.leave()
        
        container = Container(color=discord.Color.green())
        container.add_text("## ✅ Server zur Blacklist hinzugefügt!")
        container.add_text(f"**Server ID:** `{guild_id}`")
        container.add_text(f"**Grund:** {reason}")
        if auto_leave:
            container.add_text(f"**Status:** Server verlassen")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @server.command(name="unblacklist", description="Entfernt einen Server von der Blacklist")
    async def unblacklist_guild(
        self,
        ctx: discord.ApplicationContext,
        guild_id: Option(str, "Server ID")
    ):
        guild_id_str = str(guild_id)
        
        entry = next((g for g in self.blacklist["guilds"] if g["id"] == guild_id_str), None)
        
        if not entry:
            container = Container(color=discord.Color.orange())
            container.add_text("## ⚠️ Server nicht auf Blacklist!")
            container.add_text(f"Server `{guild_id}` ist nicht auf der Blacklist.")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return
        
        self.blacklist["guilds"].remove(entry)
        self.save_blacklist()
        
        container = Container(color=discord.Color.green())
        container.add_text("## ✅ Server von Blacklist entfernt!")
        container.add_text(f"**Server ID:** `{guild_id}`")
        container.add_text(f"**Ehemaliger Grund:** {entry.get('reason', 'Unbekannt')}")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @server.command(name="blacklist_list", description="Zeigt alle geblacklisteten Server an")
    async def blacklist_list_guilds(self, ctx: discord.ApplicationContext):
        guilds = self.blacklist.get("guilds", [])
        
        if not guilds:
            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Keine Server auf der Blacklist!")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return
        
        entries = []
        for g in guilds:
            added_at = datetime.fromisoformat(g["added_at"]).strftime("%d.%m.%Y %H:%M") if g.get("added_at") else "Unbekannt"
            entries.append(f"**ID:** `{g['id']}` │ **Grund:** {g.get('reason', '-')} │ {added_at}")
        
        container = Container(color=discord.Color.red())
        container.add_text(f"# 🚫 Server-Blacklist ({len(guilds)})")
        container.add_separator()
        container.add_text("\n".join(entries[:25]))
        if len(entries) > 25:
            container.add_text(f"\n... und {len(entries) - 25} weitere")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    # ===== LOGS COMMANDS =====
    
    @logs.command(name="view", description="Zeigt die letzten Admin-Logs an")
    async def view_logs(
        self,
        ctx: discord.ApplicationContext,
        limit: Option(int, "Anzahl der Einträge", required=False, default=20, min_value=1, max_value=50)
    ):
        if not AUDIT_LOG_FILE.exists():
            container = Container(color=discord.Color.orange())
            container.add_text("## ℹ️ Keine Logs vorhanden")
            await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
            return
        
        with open(AUDIT_LOG_FILE, 'r', encoding='utf-8') as f:
            logs = json.load(f)
        
        recent_logs = logs[-limit:]
        recent_logs.reverse()
        
        log_text = []
        for log in recent_logs:
            timestamp = datetime.fromisoformat(log["timestamp"]).strftime("%d.%m %H:%M")
            user = log["user_name"]
            command = log["command"]
            log_text.append(f"`{timestamp}` **{user}** → `/{command}`")
        
        container = Container(color=discord.Color.blue())
        container.add_text(f"# 📜 Admin-Logs (Letzte {len(recent_logs)})")
        container.add_separator()
        container.add_text("\n".join(log_text))
        container.add_separator()
        container.add_text(f"**Gesamt:** {len(logs)} Einträge")
        
        await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)

    @logs.command(name="clear", description="Löscht alle Admin-Logs")
    async def clear_logs(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.orange())
        container.add_text("# ⚠️ Logs löschen bestätigen")
        container.add_text("Alle Admin-Logs werden permanent gelöscht!")
        
        if await self.request_confirmation(ctx, container):
            if AUDIT_LOG_FILE.exists():
                AUDIT_LOG_FILE.unlink()
            
            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Logs gelöscht!")
            await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))
        else:
            container = Container(color=discord.Color.green())
            container.add_text("## ✅ Abgebrochen")
            await ctx.edit(view=discord.ui.DesignerView(container, timeout=0))

    # ===== TEST COMMAND =====
    
    @bot.command(name="test", description="Testet die Bot-Funktionalität")
    async def test(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.blue())
        container.add_text("## 🔄 Test wird ausgeführt...")
        
        interaction = await ctx.respond(view=discord.ui.DesignerView(container, timeout=0), ephemeral=True)
        
        await asyncio.sleep(1)
        
        container = Container(color=discord.Color.green())
        container.add_text("# ✅ Test erfolgreich!")
        container.add_separator()
        container.add_text(f"**Bot Status:** Online")
        container.add_text(f"**Latenz:** {round(self.bot.latency * 1000, 2)} ms")
        container.add_text(f"**Befehl ausgeführt von:** {ctx.author.mention}")
        container.add_text(f"**Rate Limit:** {self.command_usage.get(ctx.author.id, (0, 0))[1]}/30")
        
        await interaction.edit_original_response(view=discord.ui.DesignerView(container, timeout=0))


def setup(bot):
    bot.add_cog(admin(bot))