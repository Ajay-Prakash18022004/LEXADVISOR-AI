import sqlite3

conn = sqlite3.connect('backend/storage/legal_ai.db')
c = conn.cursor()

c.execute("SELECT id, name, email, role FROM users")
print("Before:", c.fetchall())

# If user 2 is sureshtakur194@gmail.com, delete user 1 or rename user 1 to advocate
# Let's check who user 1 was: Advocate Counsel, advocate@lexadvisor.ai, role='client'
# But advocate@lexadvisor.ai should have role='advocate' and name='Adv. Rajeshwar Rao'!
c.execute("""
    UPDATE users 
    SET name = 'Adv. Rajeshwar Rao', email = 'advocate@lexadvisor.ai', role = 'advocate'
    WHERE id = 1
""")

# Ensure user 2 is Suresh Thakur with role client
c.execute("""
    UPDATE users 
    SET name = 'Suresh Thakur', email = 'sureshtakur194@gmail.com', role = 'client'
    WHERE email = 'sureshtakur194@gmail.com'
""")

conn.commit()

c.execute("SELECT id, name, email, role FROM users")
print("After:", c.fetchall())
conn.close()
