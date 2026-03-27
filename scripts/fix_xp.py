import sqlite3
import math
import os

db_path = "data/stats.db"

def calculate_reasonable_xp(messages, voice_mins):
    # Durschnittlich 3 XP pro Nachricht + 0.5 XP pro Voice Minute
    return int((messages * 3) + (voice_mins * 0.5))

def calculate_level(xp):
    """Neue Formel: Level = (XP/50)^(2/3) + 1"""
    if xp < 50: return 1
    return int((xp / 50) ** (2/3)) + 1

def main():
    if not os.path.exists(db_path):
        print(f"Datenbank {db_path} wurde nicht gefunden.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Überprüfe global_user_levels auf Anomalien (Neue Formel angewendet)...")
    
    # Finde User mit mehr als 100.000 XP (für monatlichen Zyklus sehr hoch)
    cursor.execute('''
        SELECT user_id, global_level, global_xp, total_messages, total_voice_minutes 
        FROM global_user_levels 
        WHERE global_xp > 100000
    ''')
    
    anomalies = cursor.fetchall()
    
    if not anomalies:
        print("Keine extremen XP-Anomalien (> 100k XP) gefunden.")
        print("Möchtest du trotzdem ALLE User auf die neue Formel und realistische Werte korrigieren? (j/n)")
        choice = input().lower()
        if choice == 'j':
            cursor.execute('SELECT user_id, global_level, global_xp, total_messages, total_voice_minutes FROM global_user_levels')
            anomalies = cursor.fetchall()
            print(f"Korrigiere {len(anomalies)} User...")
        else:
            conn.close()
            return
    else:
        print(f"{len(anomalies)} extreme Anomalien gefunden.")

    for user_id, level, xp, msgs, voice in anomalies:
        new_xp = calculate_reasonable_xp(msgs, voice)
        new_level = calculate_level(new_xp)
        
        print(f"User {user_id}: {int(xp):,} XP (lvl {level}) -> {new_xp:,} XP (lvl {new_level}) [Nachrichten: {msgs}, Voice: {voice}m]")
        
        cursor.execute('''
            UPDATE global_user_levels 
            SET global_xp = ?, global_level = ? 
            WHERE user_id = ?
        ''', (new_xp, new_level, user_id))
    
    conn.commit()
    conn.close()
    print("\nFertig! Die Datenbank wurde bereinigt und an die neue Formel angepasst.")

if __name__ == "__main__":
    main()
