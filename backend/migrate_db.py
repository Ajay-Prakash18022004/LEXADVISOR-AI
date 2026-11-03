import sqlite3
import os
from pathlib import Path

db_path = Path("backend/storage/legal_ai.db")
if not db_path.exists():
    db_path = Path("storage/legal_ai.db")

print(f"Connecting to: {db_path.resolve()}")
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

def add_col_if_missing(table, col, col_type):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cursor.fetchall()]
    if col not in cols:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
        print(f"Added {col} to {table}")
    else:
        print(f"{col} already exists in {table}")

add_col_if_missing("users", "phone", "VARCHAR(50)")
add_col_if_missing("users", "city", "VARCHAR(100)")
add_col_if_missing("users", "state", "VARCHAR(100)")
add_col_if_missing("users", "preferred_language", "VARCHAR(50) DEFAULT 'English'")
add_col_if_missing("users", "role", "VARCHAR(50) DEFAULT 'client'")
add_col_if_missing("users", "google_id", "VARCHAR(150)")

add_col_if_missing("generated_docs", "parties_summary", "VARCHAR(300)")
add_col_if_missing("generated_docs", "key_terms_json", "TEXT")

add_col_if_missing("appointments", "notification_sent", "BOOLEAN DEFAULT 0")
add_col_if_missing("appointments", "notification_email", "VARCHAR(150) DEFAULT 'sureshtakur194@gmail.com'")

conn.commit()
conn.close()
print("Schema migration completed successfully.")
