import os

for root, dirs, files in os.walk('.'):
    if '.venv' in root or 'node_modules' in root or '.git' in root or 'dist' in root or 'static' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.jsx', '.js', '.json', '.md')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                    c = fl.read()
                    if 'draft agreement' in c.lower() or '+ draft' in c.lower() or 'drafting' in c.lower():
                        lines = c.split('\n')
                        for i, line in enumerate(lines):
                            if 'draft agreement' in line.lower() or '+ draft' in line.lower():
                                print(f"{p}:{i+1}: {line.strip()[:140]}")
            except Exception as e:
                pass
