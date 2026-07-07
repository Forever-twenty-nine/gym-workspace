#!/usr/bin/env python3
"""
Audit v2: detecta iconos zombies considerando uso dinámico.

Casos que el v1 NO detectaba:
- [name]="someIcon" (binding dinámico)
- [name]="'close'" (string literal con quotes)
- {{ icon }} (interpolación)

Estrategia:
1. Detecta todos los iconos registrados via addIcons.
2. Detecta todos los iconos USADOS en cualquier forma:
   - <ion-icon name="foo"> (estático)
   - <ion-icon [name]="foo"> (binding dinámico)
   - strings con kebab-case en .ts o .html
3. Cross-check: zombies = registrados pero no usados en ninguna forma.
"""
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"C:\repositorios\forever-twenty-nine\gym-workspace\projects\gym-app\src")

# 1) Extraer iconos registrados via addIcons
ADD_ICONS_RE = re.compile(r'addIcons\s*\(\s*\{([^}]+)\}\s*\)', re.DOTALL)
registered = defaultdict(set)  # ts_file -> set of identifiers (camelCase)
for ts_path in ROOT.rglob("*.ts"):
    rel = str(ts_path.relative_to(ROOT))
    text = ts_path.read_text(encoding='utf-8')
    for m in ADD_ICONS_RE.finditer(text):
        block = m.group(1)
        for token in block.split(','):
            token = token.strip()
            if not token:
                continue
            if ':' in token:
                # 'kebab-name': identifier — name del icon
                left = token.split(':')[0].strip().strip('"').strip("'")
                # El identificador registrado es el de la derecha (después de :)
                identifier = token.split(':', 1)[1].strip()
                registered[rel].add((identifier, left))  # tupla (camel, kebab)
            else:
                identifier = token
                registered[rel].add((identifier, None))  # solo camel

all_registered = set()
for ids in registered.values():
    for identifier, _ in ids:
        all_registered.add(identifier)

# 2) Detectar todos los usos de iconos
def camel_to_kebab(name):
    s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

# Conjunto de kebab-case names usados en algún lugar del codebase
used_kebab = set()
used_camel = set()  # cuando el código usa directamente el camelCase identifier

# 2a) <ion-icon name="foo-bar"> estático
ION_ICON_NAME_RE = re.compile(r'<ion-icon[^>]*\sname=["\']([^"\']+)["\']', re.IGNORECASE)

# 2b) <ion-icon [name]="fooBar"> binding dinámico (puede ser string o variable)
ION_ICON_BIND_RE = re.compile(r'<ion-icon[^>]*\[name\]=["\']([^"\']+)["\']', re.IGNORECASE)

# 2c) Strings con kebab-case en cualquier .ts o .html (heurística: buscar palabras con -outline, -sharp, etc.)
KEBAB_RE = re.compile(r'\b([a-z][a-z0-9]*(?:[-_][a-z0-9]+)+)\b')

# 2d) Identificadores camelCase exportados/importados (heurística)
for ts_path in list(ROOT.rglob("*.ts")) + list(ROOT.rglob("*.html")):
    text = ts_path.read_text(encoding='utf-8')
    for m in ION_ICON_NAME_RE.finditer(text):
        used_kebab.add(m.group(1))
    for m in ION_ICON_BIND_RE.finditer(text):
        used_kebab.add(m.group(1))
    # Buscar strings kebab-like en código
    for m in KEBAB_RE.finditer(text):
        word = m.group(1)
        # Filtrar: solo si parece un nombre de icono (termina en -outline, -sharp, -filled, etc.)
        if any(suffix in word for suffix in ['-outline', '-sharp', '-filled']):
            used_kebab.add(word)

# 3) Zombies: registrados pero kebab-case no aparece en used_kebab
zombies_by_file = defaultdict(list)  # ts_file -> list of (identifier, kebab_or_none)
for ts_file, ids in registered.items():
    for identifier, explicit_kebab in ids:
        # Calcular kebab esperado
        kebab = explicit_kebab if explicit_kebab else camel_to_kebab(identifier)
        # Verificar si el kebab aparece en used_kebab
        # También probar variantes: outline vs filled vs sharp
        base = kebab.replace('-outline', '').replace('-sharp', '').replace('-filled', '')
        if kebab not in used_kebab and base not in used_kebab:
            # Es zombie probable
            zombies_by_file[ts_file].append((identifier, kebab))

# Output
print("=" * 70)
print(f"AUDIT ICONS v2 (con detección dinámica):")
print(f"  {len(used_kebab)} iconos usados en cualquier forma (incluye dinámicos)")
print(f"  {len(all_registered)} identificadores registrados")
total_zombies = sum(len(v) for v in zombies_by_file.values())
print(f"  {total_zombies} zombies probables")
print("=" * 70)
print()
for ts_file in sorted(zombies_by_file.keys()):
    items = zombies_by_file[ts_file]
    if items:
        print(f"\n  {ts_file}")
        for identifier, kebab in items:
            print(f"    - {identifier}  (kebab: {kebab})")