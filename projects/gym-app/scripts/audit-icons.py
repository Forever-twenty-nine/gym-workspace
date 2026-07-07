#!/usr/bin/env python3
"""
Audit script: cruza <ion-icon name="X"> en templates con addIcons({X, ...}) en TS.

Detecta 2 cosas:
1. Iconos USADOS pero NO registrados en NINGÚN addIcons() del codebase → bug latente.
2. (Opcional) Iconos registrados pero NO usados en NINGÚN template → zombies.

Salida por stdout para que el agente la procese.
"""
import re
import os
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"C:\repositorios\forever-twenty-nine\gym-workspace\projects\gym-app\src")

# Match <ion-icon ... name="foo" ...> or name='foo'
ION_ICON_RE = re.compile(r'<ion-icon[^>]*\sname=["\']([^"\']+)["\']', re.IGNORECASE)

# Match addIcons({ foo, bar, ... }) — captura nombres de identificadores
# Pero también addIcons({ 'foo-outline': fooOutline }) — primero extraemos por nombre de variable
ADD_ICONS_RE = re.compile(r'addIcons\s*\(\s*\{([^}]+)\}\s*\)', re.DOTALL)

# En ionicons, los nombres kebab-case como "close-outline" se importan como camelCase
# ej: 'close-outline' → closeOutline, 'arrow-back-outline' → arrowBackOutline
def kebab_to_camel(name: str) -> str:
    parts = name.split('-')
    return parts[0] + ''.join(p.title() for p in parts[1:])

def camel_to_kebab(name: str) -> str:
    # camelCase → kebab-case
    s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

# Recolectar ion-icons usados por template
used_icons_by_template = defaultdict(set)  # template_path -> set of names
for html_path in ROOT.rglob("*.html"):
    # Ignorar archivos de Storybook stories que están en /stories/ subdirs
    rel = html_path.relative_to(ROOT)
    text = html_path.read_text(encoding='utf-8')
    for m in ION_ICON_RE.finditer(text):
        used_icons_by_template[str(rel)].add(m.group(1))

# Recolectar addIcons registrados por archivo TS
registered_by_file = defaultdict(set)  # ts_path -> set of icon identifiers (camelCase)
all_registered = set()  # set global de identifiers
for ts_path in ROOT.rglob("*.ts"):
    rel = str(ts_path.relative_to(ROOT))
    text = ts_path.read_text(encoding='utf-8')
    for m in ADD_ICONS_RE.finditer(text):
        block = m.group(1)
        # Split por comas a nivel superior (no anidado)
        # Simple: split por coma y limpiar
        for token in block.split(','):
            token = token.strip()
            if not token:
                continue
            # puede ser: "name" (string key), o "name: imported" (alias), o solo "imported" (shorthand)
            if ':' in token:
                left = token.split(':')[0].strip().strip('"').strip("'")
                right = token.split(':', 1)[1].strip()
                identifier = right
            else:
                identifier = token
                left = None
            registered_by_file[rel].add(identifier)
            all_registered.add(identifier)

# Convertir nombres kebab usados a camelCase para comparar
all_registered_camel = all_registered  # addIcons registra por identificador camelCase

# Para cada icono usado en kebab-case (ej "close-outline"), buscar si su camelCase (closeOutline) está registrado
missing = []  # (template_path, icon_name_kebab)
for tpl, names in used_icons_by_template.items():
    for name in names:
        camel = kebab_to_camel(name)
        # Buscar también variantes como "close" vs "closeOutline"
        if camel not in all_registered_camel:
            # También probar sin sufijos comunes: ej "save-outline" → "save" también sirve?
            # NO: ionicons distingue close vs closeOutline vs closeSharp, etc.
            missing.append((tpl, name, camel))

# Zombies: identifiers registrados pero cuyo kebab-case no aparece en ningún template
zombies_by_file = defaultdict(list)  # ts_path -> list of identifier (no usados)
for ts_file, ids in registered_by_file.items():
    for identifier in ids:
        # Convertir a kebab y ver si se usa
        kebab = camel_to_kebab(identifier)
        used_anywhere = any(kebab in names for names in used_icons_by_template.values())
        # También probar kebab-equivalente para variantes comunes
        if not used_anywhere:
            zombies_by_file[ts_file].append(identifier)

# Output
print("=" * 70)
print(f"AUDIT: {len(used_icons_by_template)} templates con <ion-icon>")
print(f"AUDIT: {len(registered_by_file)} archivos con addIcons()")
print(f"AUDIT: {len(all_registered)} identificadores registrados en total")
print("=" * 70)
print()
print("=" * 70)
print("BUGS LATENTES — iconos USADOS pero NO registrados:")
print("=" * 70)
if not missing:
    print("  (ninguno — todos los iconos usados están registrados)")
else:
    for tpl, name, camel in missing:
        print(f"  {tpl}")
        print(f"    <ion-icon name=\"{name}\">  →  esperaba {camel}")
        print()
print()
print("=" * 70)
print(f"ZOMBIES — identificadores registrados pero NUNCA usados ({sum(len(v) for v in zombies_by_file.values())} total):")
print("=" * 70)
total_zombies = 0
for ts_file, ids in sorted(zombies_by_file.items()):
    if ids:
        total_zombies += len(ids)
        print(f"  {ts_file}")
        for ident in ids:
            print(f"    - {ident}")
print()
print(f"TOTAL ZOMBIES: {total_zombies}")