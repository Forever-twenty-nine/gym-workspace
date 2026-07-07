#!/usr/bin/env python3
"""
Audit imports: detecta imports que se importan pero nunca se usan en el archivo.

Para cada archivo .ts:
1. Extrae nombres importados.
2. Busca cada nombre en el cuerpo del archivo (excluyendo el bloque import).
3. Si no se usa, lo marca como muerto.

Excepciones manejadas:
- Imports de side-effect (`import 'foo'`) — siempre "usados".
- Type-only imports (`import type { X }`) — se considera "usado" si X aparece como tipo.
- Re-exports (`export { X } from ...`) — siempre "usados".
- Imports con alias — busca el alias.
"""
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"C:\repositorios\forever-twenty-nine\gym-workspace\projects\gym-app\src")

# Regex para imports
# Captura: import [type] { a, b as c } from 'mod';
#           import * as Foo from 'mod';
#           import Foo from 'mod';
IMPORT_RE = re.compile(
    r"""import\s+(?:type\s+)?
        (?:
            (?:\*\s+as\s+(\w+))              # * as Foo
          | (?:(\w+)\s*,)?\s*\{([^}]+)\}      # Foo, { a, b as c }
          | (\w+)                              # default Foo
        )
        \s+from\s+['"]([^'"]+)['"]""",
    re.VERBOSE
)

# Regex para exports re-exports
EXPORT_RE = re.compile(
    r"""export\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]""",
    re.VERBOSE
)

def extract_imports(text):
    """Retorna lista de (name, source, is_type_only) para cada import."""
    imports = []
    for m in IMPORT_RE.finditer(text):
        star_as, default_prefix, named_block, default_name, source = m.groups()
        is_type = 'type ' in text[m.start():m.start()+30]
        if star_as:
            imports.append((star_as, source, is_type))
        elif named_block:
            for n in named_block.split(','):
                n = n.strip()
                if not n:
                    continue
                # 'a as b' → name to search is 'b'
                if ' as ' in n:
                    _, alias = n.split(' as ')
                    name = alias.strip()
                else:
                    name = n
                imports.append((name, source, is_type))
        elif default_name:
            imports.append((default_name, source, is_type))
    return imports

def extract_reexports(text):
    """Retorna set de nombres re-exportados (que cuentan como usados)."""
    reexports = set()
    for m in EXPORT_RE.finditer(text):
        for n in m.group(1).split(','):
            n = n.strip()
            if ' as ' in n:
                _, alias = n.split(' as ')
                reexports.add(alias.strip())
            else:
                reexports.add(n)
    return reexports

def is_used(name, body):
    """Chequea si 'name' aparece en el cuerpo fuera del bloque import.
    Usa word-boundary para evitar matches como 'Foo' matcheando 'Foobar'."""
    return bool(re.search(r'\b' + re.escape(name) + r'\b', body))

# Output
print("=" * 70)
print("AUDIT IMPORTS — nombres importados pero no usados en el archivo")
print("=" * 70)

total_dead = 0
dead_by_file = defaultdict(list)

for ts_path in sorted(ROOT.rglob("*.ts")):
    rel = str(ts_path.relative_to(ROOT))
    text = ts_path.read_text(encoding='utf-8')

    # Ignorar archivos de spec/stories
    if rel.endswith('.spec.ts') or rel.endswith('.stories.ts'):
        continue

    imports = extract_imports(text)
    reexports = extract_reexports(text)

    if not imports:
        continue

    # Quitar líneas de imports del cuerpo para no contar el import como "uso"
    body = re.sub(r'^import\s.*?$', '', text, flags=re.MULTILINE)
    # Quitar re-exports también
    body = re.sub(r'^export\s+\{.*?\}\s+from\s+.*?$', '', body, flags=re.MULTILINE)

    for name, source, is_type in imports:
        if name in reexports:
            continue
        # Para imports type-only,放宽: aparece en anotaciones de tipo igual cuenta
        if is_type:
            # buscar 'name' seguido de espacios o coma o ] o >
            if re.search(r'\b' + re.escape(name) + r'\b', body):
                continue
            else:
                dead_by_file[rel].append((name, source, True))
                total_dead += 1
        else:
            if not is_used(name, body):
                dead_by_file[rel].append((name, source, False))
                total_dead += 1

# Output
print(f"\nTOTAL DEAD IMPORTS: {total_dead}\n")
for f, items in sorted(dead_by_file.items()):
    if items:
        print(f"  {f}")
        for name, source, is_type in items:
            t = '(type)' if is_type else ''
            print(f"    - {name}  {t}  from '{source}'")