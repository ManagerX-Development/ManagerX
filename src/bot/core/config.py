"""
ManagerX - Dynamic Configuration (Zero-Mapping)
==============================================

Lädt alles aus config.yaml ohne manuelles Mapping.
Zugriff via BotConfig.section.key (entspricht der YAML Struktur)
"""

import yaml
from pathlib import Path
from colorama import Fore, Style
import sys
import os

class ConfigDict(dict):
    """Ein Dictionary, das Punkt-Notation erlaubt (Config.section.key)"""
    def __getattr__(self, name):
        if name in self:
            val = self[name]
            if isinstance(val, dict) and not isinstance(val, ConfigDict):
                val = ConfigDict(val)
                self[name] = val
            return val
        
        # Spezialfall: Falls nach 'path' oder ähnlichem auf einem leeren Dict gefragt wird
        # geben wir einen leeren String oder das Dict selbst zurück, um Abstürze zu vermeiden.
        return ConfigDict()

    def __getitem__(self, key):
        val = super().get(key, {})
        if isinstance(val, dict) and not isinstance(val, ConfigDict):
            return ConfigDict(val)
        return val

    def __setattr__(self, name, value):
        self[name] = value

class ConfigMeta(type):
    """Metaklasse, die alle Attribut-Zugriffe auf BotConfig._data umleitet."""
    def __getattr__(cls, name):
        if name.startswith('_'):
            raise AttributeError(name)
        
        # Direkter Zugriff auf das interne Dictionary
        if name in cls._data:
            return cls._data[name]
        
        # Fallback: Versuche es über ConfigDict.__getattr__
        return getattr(cls._data, name)

    @property
    def VERSION(cls): return cls._data.bot.get('version', '2.0.0')
    
    @property
    def PREFIX(cls): return cls._data.bot.get('prefix', '!mx ')
    
    @property
    def DATA_PATH(cls):
        # Sicherstellen, dass .logging existiert und ein Dict/ConfigDict ist
        log_cfg = cls._data.get('logging', {})
        path_str = log_cfg.get('data_path', 'data') if isinstance(log_cfg, dict) else 'data'
        return Path(path_str)
    
    @property
    def COGS_PATH(cls):
        log_cfg = cls._data.get('logging', {})
        path_str = log_cfg.get('cogs_path', 'src/bot/cogs') if isinstance(log_cfg, dict) else 'src/bot/cogs'
        return Path(path_str)

class BotConfig(metaclass=ConfigMeta):
    """Zentrale Konfigurations-Schnittstelle (Metaklasse übernimmt lookups)"""
    _data = ConfigDict()
    TOKEN = os.getenv("TOKEN")
    
    @classmethod
    def load(cls, basedir: Path):
        """Lädt die config.yaml und initialisiert das _data Objekt"""
        config_path = basedir / 'config' / 'config.yaml'
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                print(f"[{Fore.BLUE}DEBUG{Style.RESET_ALL}] Lade Config von: {config_path}")
                print(f"[{Fore.BLUE}DEBUG{Style.RESET_ALL}] Keys in Config: {list(data.keys()) if data else 'None'}")
                cls._data = ConfigDict(data)
                
                # Grundlegende Prüfung
                if not cls._data.bot.get('enabled', True):
                    print(f"[{Fore.YELLOW}INFO{Style.RESET_ALL}] Bot ist in config.yaml deaktiviert. Beende...")
                    sys.exit(0)
                
                return data
        except Exception as e:
            print(f"[{Fore.RED}ERROR{Style.RESET_ALL}] Konfigurationsfehler: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

# Alias für ConfigLoader
class ConfigLoader:
    def __init__(self, basedir): self.basedir = basedir
    def load(self): return BotConfig.load(self.basedir)

# Alias für ConfigLoader
class ConfigLoader:
    def __init__(self, basedir): self.basedir = basedir
    def load(self): return BotConfig.load(self.basedir)