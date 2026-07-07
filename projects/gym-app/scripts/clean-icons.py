#!/usr/bin/env python3
"""
Aplica limpieza de iconos zombies basándose en el plan.

Por archivo:
- Si TODOS los iconos son zombies → borra bloque `addIcons({...})` y limpia imports.
- Si mixto → solo borra zombies del bloque y de los imports.
"""
import re
from pathlib import Path

ROOT = Path(r"C:\repositorios\forever-twenty-nine\gym-workspace\projects\gym-app\src")

def camel_to_kebab(name):
    s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

# Reproducir detección
ADD_ICONS_RE = re.compile(r'addIcons\s*\(\s*\{([^}]+)\}\s*\)', re.DOTALL)
registered = {}
for ts_path in ROOT.rglob("*.ts"):
    rel = str(ts_path.relative_to(ROOT))
    text = ts_path.read_text(encoding='utf-8')
    file_icons = []
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

def is_used(kebab):
    base = kebab.replace('-outline', '').replace('-sharp', '').replace('-filled', '')
    return kebab in used_kebab or base in used_kebab

per_file = {}
for path, icons in registered.items():
    valid, zombie = [], []
    for identifier, explicit_kebab in icons:
        kebab = explicit_kebab if explicit_kebab else camel_to_kebab(identifier)
        if is_used(kebab):
            valid.append((identifier, kebab))
        else:
            zombie.append((identifier, kebab))
    per_file[path] = {'valid': valid, 'zombie': zombie}

# Aplicar limpieza
changes = 0
for path, info in per_file.items():
    if not info['zombie']:
        continue
    full_path = ROOT / path
    text = full_path.read_text(encoding='utf-8')
    zombie_camels = {ident for ident, _ in info['zombie']}
    valid_camels = {ident for ident, _ in info['valid']}

    # 1) Reescribir addIcons({...})
    def rewrite_addicons(m):
        global changes
        block = m.group(1)
        new_tokens = []
        for token in block.split(','):
            token = token.strip()
            if not token:
                continue
            # Detectar identifier
            if ':' in token:
                identifier = token.split(':', 1)[1].strip()
            else:
                identifier = token
            if identifier in zombie_camels:
                continue  # skip
            new_tokens.append(token)
        if not new_tokens:
            # Bloque entero muerto
            return ''  # marca para borrar línea
        # Reconstruir bloque
        if len(new_tokens) == 1:
            new_block = ' ' + new_tokens[0] + ' '
        else:
            new_block = ' ' + ', '.join(new_tokens) + ' '
        # Mantener el indent de la línea original
        line_start = m.group(0).split('addIcons')[0]
        return line_start + 'addIcons({' + new_block + '});'

    new_text = ADD_ICONS_RE.sub(rewrite_addicons, text)

    # 2) Eliminar líneas addIcons vacías (las que quedaron como `addIcons({ });` o solo con espacios)
    new_text = re.sub(r'^[ \t]*addIcons\s*\(\s*\{\s*\}\s*\)\s*;?\s*\n', '', new_text, flags=re.MULTILINE)

    # 3) Limpiar imports from 'ionicons/icons'
    def rewrite_ionicons_import(m):
        global changes
        indent = m.group(1)
        body = m.group(2)
        new_tokens = []
        for token in body.split(','):
            token = token.strip()
            if not token:
                continue
            if ' as ' in token:
                _, alias = token.split(' as ')
                identifier = alias.strip()
            else:
                identifier = token
            if identifier in zombie_camels:
                continue  # skip zombie
            new_tokens.append(token)
        if not new_tokens:
            return None  # borrar línea entera
        if len(new_tokens) == 1:
            return f"{indent}import {{ {new_tokens[0]} }} from 'ionicons/icons';\n"
        return f"{indent}import {{ {', '.join(new_tokens)} }} from 'ionicons/icons';\n"

    IONICONS_IMPORT_RE = re.compile(r'^(\s*)import\s*\{\s*([^}]+)\s*\}\s*from\s*[\'"]ionicons/icons[\'"]\s*;?\s*$', re.MULTILINE)

    lines = new_text.splitlines(keepends=True)
    new_lines = []
    for line in lines:
        m = IONICONS_IMPORT_RE.match(line)
        if m:
            rewritten = rewrite_ionicons_import(m)
            if rewritten is None:
                changes += 1
                print(f"  REMOVE import: {path}")
                continue
            if rewritten != line:
                changes += 1
                print(f"  EDIT import:   {path}")
                print(f"    {line.strip()[:90]}")
                print(f"    → {rewritten.strip()[:90]}")
            new_lines.append(rewritten)
        else:
            new_lines.append(line)

    final_text = ''.join(new_lines)

    if final_text != text:
        full_path.write_text(final_text, encoding='utf-8')
        changes += 1

print(f"\nTotal cambios: {changes}")