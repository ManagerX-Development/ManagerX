import subprocess
import re
import os

# --- TEIL A: Die Logik für den Bot-Betrieb ---

def get_current_version():
    """Liest die Version, die aktuell in der pyproject.toml steht."""
    try:
        # Sucht die pyproject.toml im Hauptverzeichnis
        with open("pyproject.toml", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("version ="):
                    # Extrahiert den String zwischen den Anführungszeichen
                    return line.split('"')[1]
    except:
        return "2.0.0-unknown"

# Diese Variable nutzt du überall in deinem Bot (z.B. settings.py)
MANAGERX_VERSION = get_current_version()


# --- TEIL B: Die Logik zum "Stempeln" (Nur wenn man die Datei direkt ausführt) ---

def update_pyproject_version():
    try:
        # 1. Den neuen Hash von Git holen
        git_hash = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode('ascii').strip()
        new_version = f"2.0.0+build{git_hash}"
        
        # 2. In die pyproject.toml schreiben
        with open("pyproject.toml", "r", encoding="utf-8") as f:
            content = f.read()
        
        # Ersetzt die alte Versionszeile durch die neue
        updated_content = re.sub(r'version\s*=\s*".*?"', f'version = "{new_version}"', content)
        
        with open("pyproject.toml", "w", encoding="utf-8") as f:
            f.write(updated_content)
            
        print(f"✅ pyproject.toml wurde auf {new_version} aktualisiert!")
    except Exception as e:
        print(f"❌ Fehler: {e}")

if __name__ == "__main__":
    # Dieser Teil läuft NUR, wenn du 'python src/bot/core/constants.py' tippst
    update_pyproject_version()