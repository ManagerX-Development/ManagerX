"""
ManagerX - Cog Manager
======================

Verwaltet das Laden und Deaktivieren von Cogs
Pfad: src/bot/core/cog_manager.py
"""

from logger import logger, Category

import os
from pathlib import Path
from logger import logger, Category

class CogManager:
    """Verwaltet Cog-Loading basierend auf dem Dateisystem und config.yaml"""
    
    # Hilfs-/Utility-Dateien, die keine Cogs sind
    UTILITY_FILES = [
        "autocomplete", "cache", "components", "config", 
        "containers", "utils", "backend", "emojis"
    ]
    
    def __init__(self, cogs_config: dict, cogs_base_path: Path = Path("src/bot/cogs")):
        self.cogs_config = cogs_config
        self.cogs_base_path = cogs_base_path
    
    def get_ignored_cogs(self) -> list:
        """
        Erstellt Liste von zu ignorierenden Cogs durch Scannen des Dateisystems.
        
        Returns:
            list: Dateinamen (ohne .py) der zu ignorierenden Cogs
        """
        ignored = self.UTILITY_FILES.copy()
        
        # Scanne das Cogs-Verzeichnis
        if not self.cogs_base_path.exists():
            logger.error(Category.BOT, f"Cogs-Verzeichnis nicht gefunden: {self.cogs_base_path}")
            return ignored

        for root, _, files in os.walk(self.cogs_base_path):
            category = Path(root).name
            if category == "cogs": continue # Root-Ordner überspringen
            
            category_config = self.cogs_config.get(category, {})
            
            for file in files:
                if not file.endswith(".py") or file.startswith("__"):
                    continue
                
                cog_name = file[:-3]
                if cog_name in self.UTILITY_FILES:
                    continue
                
                # Prüfe ob in der Config deaktiviert
                # Falls keine Kategorie gefunden wurde oder der Cog nicht in der Config steht,
                # wird er standardmäßig geladen (get(..., True))
                is_enabled = category_config.get(cog_name, True)
                
                if not is_enabled:
                    ignored.append(cog_name)
                    logger.info(Category.BOT, f"Cog '{cog_name}' deaktiviert via config.yaml (Kategorie: {category})")
        
        return list(set(ignored)) # Dubletten entfernen
    
    def is_cog_enabled(self, category: str, cog_name: str) -> bool:
        """
        Prüft ob ein bestimmter Cog aktiviert ist.
        
        Args:
            category: Kategorie des Cogs (z.B. 'fun', 'moderation')
            cog_name: Name des Cogs
            
        Returns:
            bool: True wenn aktiviert, sonst False
        """
        category_config = self.cogs_config.get(category, {})
        return category_config.get(cog_name, True)
    
    def get_enabled_cogs(self) -> dict:
        """
        Gibt alle aktivierten Cogs nach Kategorie zurück.
        
        Returns:
            dict: Dictionary mit Kategorien und aktivierten Cogs
        """
        enabled = {}
        
        for category, cogs in self.COG_MAPPING.items():
            category_config = self.cogs_config.get(category, {})
            enabled_in_category = []
            
            for cog_key, file_name in cogs.items():
                if category_config.get(cog_key, True):
                    enabled_in_category.append(file_name)
            
            if enabled_in_category:
                enabled[category] = enabled_in_category
        
        return enabled