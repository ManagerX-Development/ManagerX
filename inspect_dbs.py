import sqlite3
import os

databases = [
    "data/stats.db",
    "data/levelsystem.db",
    "src/bot/cogs/moderation/Datenbanken/warns.db",
    "data/data/notes.db",
    "data/settings.db",
    "data/welcome.db",
    "data/tempvc.db",
    "data/spam.db",
    "data/log_channels.db",
    "data/globalchat.db",
    "data/autorole.db",
    "data/autodelete.db"
]

base_path = r"a:\Bot\ManagerX"

for db_rel_path in databases:
    db_path = os.path.join(base_path, db_rel_path)
    if not os.path.exists(db_path):
        print(f"Database not found: {db_path}")
        continue
        
    print(f"\n--- Schema for {db_rel_path} ---")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            print(f"Table: {table_name}")
            
            # Get columns for each table
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
                
        conn.close()
    except Exception as e:
        print(f"Error reading {db_path}: {e}")
