import sqlite3
import os

db_path = 'backend/storage/legal_ai.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        rows = c.execute('SELECT id, name, email, role FROM users').fetchall()
        print("USERS in legal_ai.db:", rows)
    except Exception as e:
        print("Error reading users:", e)
    conn.close()
else:
    print(db_path, "does not exist")
