#!/usr/bin/env python3
"""
Audit CSS: detecta selectores `app-X` huérfanos (no hay componente con ese selector).

Para cada selector `app-foo-bar` (con sus modificadores como `> ion-foo`, `.bar`, `:hover`),
verifica que exista un componente con `selector: 'app-foo-bar'` en algún .ts.

Salida: lista de selectores huérfanos por archivo CSS, agrupados.
"""
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"C:\repositorios\forever-twenty-nine\gym-workspace\projects\gym-app\src")

# 1) Extraer selectores app-X de los CSS
# Selector empieza con app- y sigue con letras/dígitos/guiones (kebab-case)
# Luego puede tener modificadores: espacio, >, ., #, :, [, etc.
# Capturamos hasta el primer delimitador de "fin de selector": { ; o fin de bloque

APP_SELECTOR_RE = re.compile(r'\b(app-[a-z][a-z0-9-]*)\b')

selectors_used = defaultdict(set)  # css_file_path -> set of selectors
for css_path in ROOT.rglob("*.css"):
    rel = str(css_path.relative_to(ROOT))
    text = css_path.read_text(encoding='utf-8')
    for m in APP_SELECTOR_RE.finditer(text):
        selectors_used[rel].add(m.group(1))

# 2) Extraer selectores app-X definidos en TS (selector: 'app-X')
COMPONENT_SELECTOR_RE = re.compile(r"selector:\s*['\"]([^'\"]+)['\"]")
all_component_selectors = set()
selector_to_file = {}
for ts_path in ROOT.rglob("*.ts"):
    text = ts_path.read_text(encoding='utf-8')
    for m in COMPONENT_SELECTOR_RE.finditer(text):
        sel = m.group(1)
        # puede ser multi-selectors: 'app-foo, app-bar' — split por coma
        for s in sel.split(','):
            s = s.strip()
            if s.startswith('app-'):
                all_component_selectors.add(s)
                selector_to_file[s] = str(ts_path.relative_to(ROOT))

# 3) También extraer selectores desde HTML <app-foo (uso en templates)
HTML_USAGE_RE = re.compile(r'<app-[a-z][a-z0-9-]*')
selectors_used_in_html = set()
for html_path in ROOT.rglob("*.html"):
    text = html_path.read_text(encoding='utf-8')
    for m in re.finditer(r'<app-[a-z][a-z0-9-]*', text):
        # Normalizar quitando '<'
        s = m.group(0)[1:]
        selectors_used_in_html.add(s)

# 4) Combinar: un selector CSS huérfano es aquel que NO está definido NI usado en ningún HTML
known_selectors = all_component_selectors | selectors_used_in_html

# Output
print("=" * 70)
print(f"AUDIT CSS:")
print(f"  {len(selectors_used)} archivos CSS con selectores app-*")
print(f"  {len(all_component_selectors)} selectores definidos en .ts (Component decorator)")
print(f"  {len(selectors_used_in_html)} selectores usados en .html")
print(f"  {len(known_selectors)} selectores conocidos (definidos + usados)")
print("=" * 70)
print()

# 5) Por cada CSS, identificar selectores huérfanos
orphan_by_file = defaultdict(list)
total_orphans = 0
for css_file, sels in sorted(selectors_used.items()):
    for sel in sorted(sels):
        if sel not in known_selectors:
            orphan_by_file[css_file].append(sel)
            total_orphans += 1

print("=" * 70)
print(f"SELECTORES HUÉRFANOS — declarados en CSS pero sin componente: {total_orphans}")
print("=" * 70)
if total_orphans == 0:
    print("  (ninguno — todo selector CSS apunta a un componente existente)")
else:
    for css_file, sels in sorted(orphan_by_file.items()):
        if sels:
            print(f"\n  {css_file}")
            for sel in sels:
                print(f"    - {sel}")
print()

# 6) Bonus: selectores DEFINIDOS pero no usados en ningún CSS ni HTML (componentes huérfanos)
defined_but_unused = []
for sel in sorted(all_component_selectors):
    used_in_css = any(sel in sels for sels in selectors_used.values())
    used_in_html = sel in selectors_used_in_html
    if not used_in_css and not used_in_html:
        defined_but_unused.append(sel)

print("=" * 70)
print(f"COMPONENTES DECLARADOS PERO NO USADOS (ni en CSS ni en HTML): {len(defined_but_unused)}")
print("=" * 70)
for sel in defined_but_unused:
    print(f"  {sel}  →  {selector_to_file.get(sel, '?')}")