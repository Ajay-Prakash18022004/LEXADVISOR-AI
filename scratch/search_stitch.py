import os

for root, dirs, files in os.walk('stitch_lexadvisor_ai_platform'):
    for f in files:
        if f.endswith('.html'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                c = fl.read()
                if 'draft' in c.lower() or 'remedial' in c.lower():
                    lines = c.split('\n')
                    for i, l in enumerate(lines):
                        if 'draft' in l.lower() or 'remedial' in l.lower() or 'counter-clause' in l.lower():
                            print(f"{p}:{i+1}: {l.strip()[:140]}")

