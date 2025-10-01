"""Render all Jinja2 templates under templates/{{project_slug}} with StrictUndefined.
Exit non-zero on any template rendering error. Intended for CI/locally to catch undefined variables.

Usage: python tools/check_templates.py

It will render templates with a conservative sample context. Add more keys to SAMPLE_CONTEXT as needed.
"""
import argparse
import os
import sys

from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = os.path.join(os.getcwd(), 'templates', '{{project_slug}}')

# Minimal sample context to satisfy typical template variables
SAMPLE_CONTEXT = {
    'project_name': 'Example Project',
    'project_slug': 'example-project',
    'author_name': 'Acme Maintainer',
    'repo_url': 'https://github.com/example/example-project',
    'year': '2025',
    # Copier variables used directly; no cookiecutter namespace in this project
}


def find_templates(root, subdir=None):
    templates = []
    for dirpath, dirnames, filenames in os.walk(root):
        for f in filenames:
            if f.endswith('.j2'):
                rel = os.path.relpath(os.path.join(dirpath, f), root)
                # Normalize to forward slashes for consistent matching
                rel = rel.replace(os.path.sep, '/')
                if subdir:
                    if rel.startswith(subdir.rstrip('/') + '/') or rel == subdir.rstrip('/'):
                        templates.append(rel)
                else:
                    templates.append(rel)
    return sorted(templates)


def main():
    parser = argparse.ArgumentParser(description='Check Jinja2 templates under templates/{{project_slug}} using StrictUndefined')
    parser.add_argument('--subdir', '-s', default='docs', help="Subdirectory under templates/{{project_slug}} to check (default: 'docs')")
    parser.add_argument('--all', action='store_true', help='Check all templates under templates/{{project_slug}}')
    parser.add_argument('--year', default=SAMPLE_CONTEXT['year'], help='Year to inject into sample context')
    args = parser.parse_args()

    if not os.path.isdir(ROOT):
        print('Templates root not found:', ROOT)
        return 2

    loader = FileSystemLoader(ROOT)
    env = Environment(loader=loader, undefined=StrictUndefined, autoescape=True)

    subdir = None if args.all else args.subdir
    templates = find_templates(ROOT, subdir=subdir)
    if not templates:
        print(f'No templates found for check (root={ROOT}, subdir={subdir})')
        return 2

    # Update sample context with CLI overrides
    ctx = dict(SAMPLE_CONTEXT)
    ctx['year'] = args.year

    failures = 0
    for tname in templates:
        try:
            tmpl = env.get_template(tname)
            _ = tmpl.render(ctx)
            print('OK:', tname)
        except Exception as e:
            failures += 1
            print('ERROR:', tname, type(e).__name__, '-', e)

    if failures:
        print(f'\nFAILED: {failures} templates failed to render.')
        return 1
    print('\nAll templates rendered successfully (StrictUndefined)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
