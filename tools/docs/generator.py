#!/usr/bin/env python3
"""
MERGE-TASK-011: Documentation Generator CLI (Python wrapper)
Traceability: PRD-MERGE-006, ADR-MERGE-008

This wrapper delegates to a small Node helper (`run_generator.js`) which
loads the actual generator module with robust handling for both CommonJS and
ES modules. This keeps the Python code simple and avoids complex inlined JS.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


RUNNER = Path(__file__).parent / 'run_generator.js'


def run_ts_generator(output_dir: str, context: dict[str, Any]) -> dict[str, Any]:
    """Run the Node-based documentation generator via the helper runner.

    Returns the parsed JSON result from the runner on success.
    Raises Exception on non-zero exit.
    """
    # Create a temporary file for the context
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(context, f)
        context_file = f.name

    try:
        result = subprocess.run([
            'node', str(RUNNER), context_file, output_dir, 'generate'
        ], capture_output=True, text=True, cwd=Path(__file__).parent)

        if result.returncode != 0:
            raise Exception(result.stdout or result.stderr or 'unknown error')

        return json.loads(result.stdout)

    finally:
        try:
            Path(context_file).unlink()
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser(
        description="Generate comprehensive documentation for hexagonal architecture projects"
    )

    parser.add_argument('--project-name', required=True, help='Name of the project')
    parser.add_argument(
        '--description', default='A modern application built with hexagonal architecture', help='Project description'
    )
    parser.add_argument('--domains', nargs='+', default=['core'], help='List of domain names')
    parser.add_argument('--frameworks', nargs='+', default=['next'], help='List of frameworks used')
    parser.add_argument(
        '--architecture', default='hexagonal', choices=['hexagonal', 'layered', 'microservices'], help='Architecture style'
    )
    parser.add_argument('--include-ai', action='store_true', help='Include AI-enhanced features documentation')
    parser.add_argument('--output-dir', default='./docs', help='Output directory for generated documentation')
    parser.add_argument('--templates-dir', help='Generate templates in specified directory (for Copier usage)')
    parser.add_argument('--validate', action='store_true', help='Validate generated documentation')
    parser.add_argument('--format', choices=['markdown', 'html', 'docx', 'epub'], default='markdown')

    args = parser.parse_args()

    context = {
        'projectName': args.project_name,
        'description': args.description,
        'domains': args.domains,
        'frameworks': args.frameworks,
        'architecture': args.architecture,
        'includeAI': args.include_ai,
    }

    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    try:
        print(f"Generating documentation for {args.project_name}...")

        result = run_ts_generator(str(output_path), context)

        if not result.get('success'):
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
            sys.exit(1)

        docs = result.get('docs', {})

        fmt = args.format

        def write_file(name: str, content: str):
            md_path = output_path / f"{name}.md"
            md_path.write_text(content)
            if fmt == 'markdown':
                return md_path
            pandoc = shutil.which('pandoc')
            if not pandoc:
                print(f"⚠️  pandoc not found; falling back to writing markdown for {name}")
                return md_path
            out_ext = 'html' if fmt == 'html' else fmt
            out_path = output_path / f"{name}.{out_ext}"
            subprocess.run([pandoc, str(md_path), '-o', str(out_path)], check=False)
            return out_path

        write_file('README', docs.get('readme', ''))
        write_file('ARCHITECTURE', docs.get('architectureGuide', ''))
        write_file('API-REFERENCE', docs.get('apiDocs', ''))

        print(f"✅ Documentation generated successfully in {output_path} (format: {fmt})")

        # Templates
        if args.templates_dir:
            templates_path = Path(args.templates_dir)
            templates_path.mkdir(parents=True, exist_ok=True)
            t_result = subprocess.run(['node', str(RUNNER), ':unused_context', str(templates_path), 'templates'], capture_output=True, text=True, cwd=Path(__file__).parent)
            if t_result.returncode == 0:
                print(f"✅ Templates generated successfully in {templates_path}")
            else:
                print(f"❌ Template generation failed: {t_result.stdout or t_result.stderr}")

        # Validation
        if args.validate:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as vf:
                json.dump({'docs': docs}, vf)
                validation_file = vf.name
            v_result = subprocess.run(['node', str(RUNNER), validation_file, str(output_path), 'validate'], capture_output=True, text=True, cwd=Path(__file__).parent)
            try:
                Path(validation_file).unlink()
            except Exception:
                pass
            if v_result.returncode == 0:
                validation = json.loads(v_result.stdout)
                if validation.get('isValid'):
                    print(f"✅ Documentation validation passed (score: {validation.get('score', 0):.2f})")
                else:
                    print("❌ Documentation validation failed:")
                    for section in validation.get('missingSection', []):
                        print(f"  - Missing: {section}")
                    for warning in validation.get('warnings', []):
                        print(f"  - Warning: {warning}")
            else:
                print(f"❌ Validation failed: {v_result.stdout or v_result.stderr}")

        print("\n📖 Generated Documentation:")
        print("  - README.md: Project overview and getting started")
        print("  - ARCHITECTURE.md: Detailed architecture guide")
        print("  - API-REFERENCE.md: Complete API documentation")

    except Exception as e:
        print(f"❌ Error generating documentation: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
