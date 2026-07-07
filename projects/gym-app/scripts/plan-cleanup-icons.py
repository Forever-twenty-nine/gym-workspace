#!/usr/bin/env python3
"""
Limpia iconos zombies basándose en audit-icons-v2.

Estrategia conservadora:
1. Para cada archivo, lista iconos registrados.
2. Clasifica cada uno en zombie o válido (usado en algún template).
3. Si TODOS los iconos del archivo son zombies → borra el `addIcons({...})` call y los imports correspondientes.
4. Si es mixto → solo borra los zombies del `addIcons({...})` y de los imports.
5. Si TODOS los iconos de un import son zombies → borra la línea de import entera.

Crea un log detallado de cada cambio.
"""
import re
from pathlib import Path

ROOT = Path(r"C:\repositorios\forever-twenty-nine\gym-workspace\projects\gym-app\src")

def camel_to_kebab(name):
    s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

# Reproducir lógica de detección de zombies
ADD_ICONS_RE = re.compile(r'addIcons\s*\(\s*\{([^}]+)\}\s*\)', re.DOTALL)
registered = {}
for ts_path in ROOT.rglob("*.ts"):
    rel = str(ts_path.relative_to(ROOT))
    text = ts_path.read_text(encoding='utf-8')
    file_icons = []  # list of (camel, kebab_or_None)
    for m in ADD_ICONS_RE.finditer(text):
        block = m.group(1)
        for token in block.split(','):
            token = token.strip()
            if not token:
                continue
            if ':' in token:
                kebab = token.split(':')[0].strip().strip('"').strip("'")
                identifier = token.split(':', 1)[1].strip()
                file_icons.append((identifier, kebab))
            else:
                identifier = token
                file_icons.append((identifier, None))
    if file_icons:
        registered[rel] = file_icons

# Detectar uso
ION_ICON_NAME_RE = re.compile(r'<ion-icon[^>]*\sname=["\']([^"\']+)["\']', re.IGNORECASE)
ION_ICON_BIND_RE = re.compile(r'<ion-icon[^>]*\[name\]=["\']([^"\']+)["\']', re.IGNORECASE)
KEBAB_RE = re.compile(r'\b([a-z][a-z0-9]*(?:[-_][a-z0-9]+)+)\b')

used_kebab = set()
for p in list(ROOT.rglob("*.ts")) + list(ROOT.rglob("*.html")):
    text = p.read_text(encoding='utf-8')
    for m in ION_ICON_NAME_RE.finditer(text):
        used_kebab.add(m.group(1))
    for m in ION_ICON_BIND_RE.finditer(text):
        used_kebab.add(m.group(1))
    for m in KEBAB_RE.finditer(text):
        word = m.group(1)
        if any(suf in word for suf in ['-outline', '-sharp', '-filled']):
            used_kebab.add(word)

# Para cada archivo: clasificar iconos en zombie vs válido
def is_used(kebab):
    base = kebab.replace('-outline', '').replace('-sharp', '').replace('-filled', '')
    return kebab in used_kebab or base in used_kebab

per_file = {}  # path -> {valid: [], zombie: []}
for path, icons in registered.items():
    valid, zombie = [], []
    for identifier, explicit_kebab in icons:
        kebab = explicit_kebab if explicit_kebab else camel_to_kebab(identifier)
        if is_used(kebab):
            valid.append((identifier, kebab))
        else:
            zombie.append((identifier, kebab))
    per_file[path] = {'valid': valid, 'zombie': zombie}

# Decidir limpieza por archivo
print("=" * 70)
print("PLAN DE LIMPIEZA:")
print("=" * 70)
for path, info in sorted(per_file.items()):
    n_valid = len(info['valid'])
    n_zombie = len(info['zombie'])
    if n_zombie == 0:
        continue  # nada que limpiar
    action = "BORRAR TODO addIcons" if n_valid == 0 else f"BORRAR {n_zombie}/{n_valid+n_zombie} iconos"
    print(f"\n  {path}")
    print(f"    {action}")
    print(f"    Válidos: {[k for _, k in info['valid']]}")
    print(f"    Zombies: {[k for _, k in info['zombie']]}")