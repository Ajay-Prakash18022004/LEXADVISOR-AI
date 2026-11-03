import os

for root, dirs, files in os.walk('.'):
    if '.venv' in root or 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.jsx', '.js', '.json', '.md')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                    lines = fl.readlines()
                    for idx, line in enumerate(lines):
                        if 'direct legal workflows' in line.lower() or 'draft agreement' in line.lower():
                            print(f"{p}:{idx+1}: {line.strip()[:120]}")
            except Exception as e:
                pass
