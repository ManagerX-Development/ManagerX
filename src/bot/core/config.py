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
            if isinstance(val, dict):
                return ConfigDict(val)
            return val
        # Fallback für verschachtelte Zugriffe auf nicht existierende Keys
        return ConfigDict() 

    def __setattr__(self, name, value):
        self[name] = value
    
    def get(self, key, default=None):
        return super().get(key, default)

class classproperty(object):
    def __init__(self, fget):
        self.fget = fget
    def __get__(self, owner_self, owner_cls):
        return self.fget(owner_cls)

class BotConfig:
    """Zentrale Konfigurations-Schnittstelle"""
    _data = ConfigDict()
    TOKEN = os.getenv("TOKEN")
    
    @classmethod
    def load(cls, basedir: Path):
        """Lädt die config.yaml und initialisiert das _data Objekt"""
        config_path = basedir / 'config' / 'config.yaml'
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                cls._data = ConfigDict(data)
                
                # Grundlegende Prüfung
                if not cls._data.get('bot', {}).get('enabled', True):
                    print(f"[{Fore.YELLOW}INFO{Style.RESET_ALL}] Bot ist in config.yaml deaktiviert. Beende...")
                    sys.exit(0)
                
                return data
        except Exception as e:
            print(f"[{Fore.RED}ERROR{Style.RESET_ALL}] Konfigurationsfehler: {e}")
            sys.exit(1)

    def __getattr__(self, name):
        return getattr(self._data, name)

    @classproperty
    def bot(cls): return cls._data.get('bot', ConfigDict())
    @classproperty
    def security(cls): return cls._data.get('security', ConfigDict())
    @classproperty
    def ui(cls): return cls._data.get('ui', ConfigDict())
    @classproperty
    def api(cls): return cls._data.get('api', ConfigDict())
    @classproperty
    def leveling(cls): return cls._data.get('leveling', ConfigDict())
    @classproperty
    def moderation(cls): return cls._data.get('moderation', ConfigDict())
    @classproperty
    def global_chat(cls): return cls._data.get('global_chat', ConfigDict())
    @classproperty
    def logging(cls): return cls._data.get('logging', ConfigDict())
    @classproperty
    def links(cls): return cls._data.get('links', ConfigDict())
    @classproperty
    def intervals(cls): return cls._data.get('intervals', ConfigDict())
    @classproperty
    def features(cls): return cls._data.get('features', ConfigDict())
    @classproperty
    def translation(cls): return cls._data.get('translation', ConfigDict())

    # --- Legacy Aliases/Shortcuts (Minimale Liste für Pfade) ---
    @classproperty
    def VERSION(cls): return cls.bot.get('version', '2.0.0')
    @classproperty
    def PREFIX(cls): return cls.bot.get('prefix', '!mx ')
    @classproperty
    def LANGUAGE(cls): return cls.bot.get('language', 'de')
    
    @classproperty
    def DATA_PATH(cls): return Path(cls.logging.get('data_path', 'data'))
    @classproperty
    def COGS_PATH(cls): return Path(cls.logging.get('cogs_path', 'src/bot/cogs'))

# Alias für ConfigLoader
class ConfigLoader:
    def __init__(self, basedir): self.basedir = basedir
    def load(self): return BotConfig.load(self.basedir)