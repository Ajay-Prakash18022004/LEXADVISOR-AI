import os

keywords = ['draft agreement', 'direct legal workflows', 'counter-clause', 'counsel', 'advocate counsel']
for folder in ['frontend', 'stitch_lexadvisor_ai_platform']:
    for root, dirs, files in os.walk(folder):
        for f in files:
            if f.endswith(('.jsx', '.js', '.html', '.css')):
                p = os.path.join(root, f)
                try:
                    with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                        text = fl.read().lower()
                        for kw in keywords:
                            if kw in text:
                                print(f"Found '{kw}' in {p}")
                except Exception as ex:
                    print(f"Error {p}: {ex}")

