import sqlite3
import os
from pathlib import Path

db_path = Path("backend/storage/legal_ai.db")
if not db_path.exists():
    print(f"Database file not found at {db_path}")
    exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cursor.fetchall()]
print("Existing tables:", tables)

def get_columns(table_name):
    cursor.execute(f"PRAGMA table_info({table_name});")
    return [r[1] for r in cursor.fetchall()]

# 1. Update advocates table
if "advocates" in tables:
    adv_cols = get_columns("advocates")
    print("advocates cols before:", adv_cols)
    new_adv_cols = [
        ("user_id", "INTEGER REFERENCES users(id)"),
        ("verification_status", "VARCHAR(50) DEFAULT 'pending'"),
        ("bio", "TEXT"),
        ("state_bar_council", "VARCHAR(100)"),
        ("languages_spoken", "VARCHAR(200) DEFAULT 'English, Hindi, Telugu'"),
        ("available_days", "VARCHAR(200) DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday'"),
        ("available_time_slots", "TEXT DEFAULT '[\"10:00 AM\", \"11:30 AM\", \"02:30 PM\", \"04:00 PM\", \"05:30 PM\"]'"),
        ("consultation_modes", "VARCHAR(200) DEFAULT 'In-Chamber, Phone Consultation, Video Call'"),
        ("slot_duration_mins", "INTEGER DEFAULT 30"),
        ("avatar_url", "VARCHAR(300)")
    ]
    for col_name, col_def in new_adv_cols:
        if col_name not in adv_cols:
            cursor.execute(f"ALTER TABLE advocates ADD COLUMN {col_name} {col_def};")
            print(f"Added column {col_name} to advocates")

    # Ensure pre-seeded advocates have verified status for a good experience
    cursor.execute("UPDATE advocates SET verification_status = 'verified' WHERE verification_status IS NULL OR verification_status = 'pending'")
    conn.commit()

# 2. Update appointments table
if "appointments" in tables:
    app_cols = get_columns("appointments")
    print("appointments cols before:", app_cols)
    new_app_cols = [
        ("rejection_reason", "TEXT"),
        ("rescheduled_date", "VARCHAR(50)"),
        ("rescheduled_time", "VARCHAR(50)")
    ]
    for col_name, col_def in new_app_cols:
        if col_name not in app_cols:
            cursor.execute(f"ALTER TABLE appointments ADD COLUMN {col_name} {col_def};")
            print(f"Added column {col_name} to appointments")
    conn.commit()

# 3. Create legal_cases table
cursor.execute("""
CREATE TABLE IF NOT EXISTS legal_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_number VARCHAR(50) UNIQUE,
    client_id INTEGER NOT NULL REFERENCES users(id),
    advocate_id INTEGER NOT NULL REFERENCES advocates(id),
    appointment_id INTEGER REFERENCES appointments(id),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Civil / Property',
    status VARCHAR(50) DEFAULT 'New',
    description TEXT,
    next_hearing_date VARCHAR(50),
    court_name VARCHAR(200),
    resolution_date VARCHAR(50),
    resolution_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# 4. Create case_activities table
cursor.execute("""
CREATE TABLE IF NOT EXISTS case_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id),
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    activity_type VARCHAR(50) DEFAULT 'status_change',
    message TEXT NOT NULL,
    is_private_to_advocate BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# 5. Create case_documents table
cursor.execute("""
CREATE TABLE IF NOT EXISTS case_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'document',
    uploaded_by_role VARCHAR(50) DEFAULT 'client',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

conn.commit()

# Check tables after migration
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables after migration:", [r[0] for r in cursor.fetchall()])

# Create or verify advocate user account if not exists
cursor.execute("SELECT id, email, role FROM users WHERE email='advocate@lexadvisor.ai';")
adv_user = cursor.fetchone()
print("Advocate user in DB:", adv_user)

conn.close()
print("Migration completed successfully.")

