#!/usr/bin/env python3
"""
Limpia imports muertos basándose en el audit anterior.

Para cada archivo con imports muertos:
1. Lee el archivo.
2. Para cada línea de import, identifica qué nombres importados se usan y cuáles no.
3. Reescribe la línea de import solo con los nombres usados.
4. Si la línea queda vacía, la elimina.

Hacer backup primero. Si algo se rompe, git checkout restaura.
"""
import re
from pathlib import Path

ROOT = Path(r"C:\repositorios\forever-twenty-nine\gym-workspace\projects\gym-app\src")

# Reproducir la lógica de detección de imports del audit-imports.py
IMPORT_LINE_RE = re.compile(
    r"""^(\s*)import\s+(type\s+)?
        (?:
            (?:\*\s+as\s+(\w+))
          | (?:(\w+)\s*,)?\s*\{([^}]+)\}
          | (\w+)
        )
        \s+from\s+(['"][^'"]+['"])\s*;?\s*$""",
    re.VERBOSE | re.MULTILINE
)

def parse_import_line(line):
    """Retorna (indent, is_type, prefix_default, named_list_or_none, default_name_or_none, source) o None si no matchea."""
    m = IMPORT_LINE_RE.match(line)
    if not m:
        return None
    indent, type_kw, star_as, default_prefix, named_block, default_name, source = m.groups()
    is_type = bool(type_kw)
    named = []
    if named_block:
        for n in named_block.split(','):
            n = n.strip()
            if not n:
                continue
            if ' as ' in n:
                orig, alias = n.split(' as ')
                named.append((orig.strip(), alias.strip()))
            else:
                named.append((n, n))
    return {
        'indent': indent,
        'is_type': is_type,
        'star_as': star_as,
        'default_prefix': default_prefix,
        'named': named,  # list of (orig, alias_used_in_body)
        'default_name': default_name,
        'source': source,
        'raw': line
    }

def remove_dead_from_import(parsed, dead_names):
    """Retorna la línea de import sin los nombres muertos, o None si la línea queda vacía."""
    if parsed['star_as']:
        # import * as Foo from 'mod'
        return parsed['raw'] if parsed['star_as'] not in dead_names else None
    if parsed['default_name'] and not parsed['named']:
        # import Foo from 'mod'
        return parsed['raw'] if parsed['default_name'] not in dead_names else None
    # Hay named imports — posiblemente con default prefix
    new_named = []
    for orig, alias in parsed['named']:
        if alias not in dead_names:
            new_named.append((orig, alias))
    if not new_named and not parsed['default_name']:
        # Toda la named list está muerta
        return None
    if not new_named and parsed['default_name'] and parsed['default_name'] not in dead_names:
        # Solo queda el default
        return f"{parsed['indent']}import {parsed['default_name']} from {parsed['source']};\n"
    # Reconstruir named list
    if parsed['is_type']:
        prefix = "import type "
    else:
        prefix = "import "
    parts = []
    if parsed['default_name'] and parsed['default_name'] not in dead_names:
        parts.append(parsed['default_name'])
    if new_named:
        # Sintaxis: import Default, { a, b as c } from 'mod';
        # Si hay default, va con coma: `Default, { ... }`
        named_strs = []
        for orig, alias in new_named:
            if orig == alias:
                named_strs.append(orig)
            else:
                named_strs.append(f"{orig} as {alias}")
        if parts:
            return f"{parsed['indent']}{prefix}{parts[0]}, {{ {', '.join(named_strs)} }} from {parsed['source']};\n"
        else:
            return f"{parsed['indent']}{prefix}{{ {', '.join(named_strs)} }} from {parsed['source']};\n"
    return None

# Lista de archivos y nombres muertos del audit (copiada del output)
DEAD_IMPORTS = {
    "app\\auth\\onboarding\\onboarding.page.ts": [("IonItem", False), ("IonAccordion", False)],
    "app\\auth\\welcome\\welcome.page.ts": [("IonHeader", False), ("IonToolbar", False), ("IonTitle", False)],
    "app\\core\\guards\\role.guard.ts": [("switchMap", False)],
    "app\\core\\services\\convocatoria.service.ts": [("computed", False)],
    "app\\core\\services\\entrenador.service.ts": [("Ejercicio", False)],
    "app\\core\\services\\invitacion.service.ts": [("EntrenadoService", False), ("PlanLimitError", False)],
    "app\\core\\services\\mensajes-globales.service.ts": [("query", False), ("where", False), ("orderBy", False)],
    "app\\core\\services\\notificacion.service.ts": [("TipoNotificacion", False)],
    "app\\core\\services\\plan.service.ts": [("Observable", False)],
    "app\\core\\services\\progreso.service.ts": [("computed", False), ("Signal", False), ("Entrenado", False), ("SesionRutina", False), ("EstadisticasEntrenado", False), ("uuidv4", False)],
    "app\\core\\services\\tipo-entrenamiento.service.ts": [("computed", False)],
    "app\\entrenado\\creaciones\\components\\convocatoria\\convocatoria-modal\\convocatoria-modal.component.ts": [("signal", False), ("sparkles", False), ("chevronDownOutline", False), ("chevronUpOutline", False)],
    "app\\entrenado\\creaciones\\creaciones.page.ts": [("blurActiveElement", False)],
    "app\\entrenado\\dashboard\\dashboard.page.ts": [("Objetivo", False), ("Plan", False), ("DashboardRutina", True)],
    "app\\entrenado\\entrenado-tabs\\entrenado-tabs.page.ts": [("signal", False)],
    "app\\entrenado\\rutina-progreso\\rutina-progreso.page.ts": [("ActionSheetController", False)],
    "app\\entrenado\\social\\components\\mutual-match-overlay\\mutual-match-overlay.component.ts": [("IonAccordion", False)],
    "app\\entrenado\\social\\testing-mocks.ts": [("SesionRutina", False)],
    "app\\entrenador\\agenda\\agenda.page.ts": [("Rol", False)],
    "app\\entrenador\\agenda\\components\\crear-agenda-modal\\crear-agenda-modal.component.ts": [("OnChanges", False), ("signal", False)],
    "app\\entrenador\\dashboard\\dashboard.page.ts": [("signal", False), ("IonButton", False), ("IonIcon", False)],
    "app\\entrenador\\entrenados\\entrenados.page.ts": [("Rol", False), ("TipoNotificacion", False)],
    "app\\entrenador\\rutinas\\rutinas.page.ts": [("NgOptimizedImage", False), ("EjercicioService", False)],
    "app\\gimnasio\\gimnasio-dashboard\\gimnasio-dashboard.page.ts": [("signal", False), ("IonCardContent", False), ("IonButton", False), ("TipoEntrenamiento", False)],
    "app\\shared\\agenda\\components\\crear-agenda-modal\\crear-agenda-modal.component.ts": [("signal", False)],
    "app\\shared\\components\\tipos-entrenamiento\\tipo-entrenamiento-modal\\tipo-entrenamiento-modal.ts": [("BackgroundComponent", False)],
    "app\\shared\\profile\\notifications\\notifications.component.ts": [("DatePipe", False)],
    "app\\shared\\profile\\profile-tab-estadisticas\\components\\entrenador-stats\\entrenador-stats.component.ts": [("addIcons", False), ("peopleOutline", False), ("barbellOutline", False), ("fitnessOutline", False), ("calendarOutline", False), ("timeOutline", False)],
    "app\\shared\\profile\\profile-tab-estadisticas\\components\\profile-stats-teaser\\profile-stats-teaser.component.ts": [("IonButton", False), ("IonIcon", False), ("IonCard", False), ("IonCardTitle", False), ("IonCardContent", False)],
    "app\\shared\\profile\\profile.page.ts": [("NgOptimizedImage", False), ("IonIcon", False), ("ProgresoEstadisticasComponent", False)],
    "main.ts": [("InjectionToken", False)],
}

changes = 0
for rel_path, dead_list in DEAD_IMPORTS.items():
    full_path = ROOT.parent / rel_path if rel_path == "main.ts" else ROOT / rel_path
    if not full_path.exists():
        print(f"SKIP (not found): {rel_path}")
        continue
    text = full_path.read_text(encoding='utf-8')
    lines = text.splitlines(keepends=True)
    dead_names = {name for name, _ in dead_list}
    new_lines = []
    for line in lines:
        parsed = parse_import_line(line)
        if parsed is None:
            new_lines.append(line)
            continue
        # Verificar si alguno de los dead names está en esta línea
        all_names_in_line = set()
        if parsed['star_as']:
            all_names_in_line.add(parsed['star_as'])
        if parsed['default_name']:
            all_names_in_line.add(parsed['default_name'])
        for orig, alias in parsed['named']:
            all_names_in_line.add(alias)
        if not dead_names.intersection(all_names_in_line):
            new_lines.append(line)
            continue
        # Esta línea tiene names muertos — reescribir
        new_line = remove_dead_from_import(parsed, dead_names)
        if new_line is None:
            # línea entera muerta, no agregar
            changes += 1
            print(f"  REMOVE: {rel_path}: {line.strip()[:80]}")
        else:
            new_lines.append(new_line)
            if new_line != line:
                changes += 1
                print(f"  EDIT:   {rel_path}: {line.strip()[:80]}")
                print(f"        → {new_line.strip()[:80]}")
    full_path.write_text(''.join(new_lines), encoding='utf-8')

print(f"\nTotal cambios: {changes}")