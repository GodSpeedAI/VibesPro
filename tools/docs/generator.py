#!/usr/bin/env python3
"""
MERGE-TASK-011: Documentation Generator CLI
Traceability: PRD-MERGE-006, ADR-MERGE-008
"""

import argparse
import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, Any


# Import the TypeScript generator functions via Node.js bridge
import subprocess
import tempfile
import shutil

def run_ts_generator(output_dir: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Run the TypeScript documentation generator via Node.js"""

    # Create a temporary file for the context
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(context, f)
        context_file = f.name

    try:
        # Run the TypeScript generator
        result = subprocess.run([
            'node', '-e', f"""
const {{ DocumentationGenerator }} = require('./tools/docs/generator');
const fs = require('fs');

const contextFile = {json.dumps(context_file)};
const context = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
const outputDir = {json.dumps(str(output_dir))};
const generator = new DocumentationGenerator(outputDir);

async function main() {{
    try {{
        const docs = await generator.generateDocumentation(context);
        console.log(JSON.stringify({{ success: true, docs }}));
    }} catch (error) {{
        console.error(JSON.stringify({{ success: false, error: error.message }}));
        process.exit(1);
    }}
}}

main();
"""
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent.parent)

        if result.returncode != 0:
            raise Exception(f"Generator failed: {result.stderr}")

        return json.loads(result.stdout)

    finally:
        Path(context_file).unlink()

def main():
    parser = argparse.ArgumentParser(
        description="Generate comprehensive documentation for hexagonal architecture projects"
    )

    parser.add_argument(
        '--project-name',
        required=True,
        help='Name of the project'
    )

    parser.add_argument(
        '--description',
        default='A modern application built with hexagonal architecture',
        help='Project description'
    )

    parser.add_argument(
        '--domains',
        nargs='+',
        default=['core'],
        help='List of domain names'
    )

    parser.add_argument(
        '--frameworks',
        nargs='+',
        default=['next'],
        help='List of frameworks used'
    )

    parser.add_argument(
        '--architecture',
        default='hexagonal',
        choices=['hexagonal', 'layered', 'microservices'],
        help='Architecture style'
    )

    parser.add_argument(
        '--include-ai',
        action='store_true',
        help='Include AI-enhanced features documentation'
    )

    parser.add_argument(
        '--output-dir',
        default='./docs',
        help='Output directory for generated documentation'
    )

    parser.add_argument(
        '--templates-dir',
        help='Generate templates in specified directory (for Copier usage)'
    )

    parser.add_argument(
        '--validate',
        action='store_true',
        help='Validate generated documentation'
    )

    parser.add_argument(
        '--format',
        choices=['markdown', 'html', 'docx', 'epub'],
        default='markdown',
        help='Output format for documentation (markdown|html|docx|epub). Requires pandoc for non-markdown outputs.'
    )

    parser.epilog = (
        "Supported output formats: markdown (default), html, docx, epub. "
        "The TypeScript generator produces Markdown; for non-markdown outputs this "
        "wrapper will attempt to invoke the `pandoc` binary to convert the generated "
        "Markdown files. If pandoc is not installed the script will fall back to "
        "writing Markdown files and print a warning."
    )

    # Note: The TypeScript generator returns Markdown content. For non-markdown
    # outputs this Python wrapper will invoke `pandoc` (if available) to
    # convert the generated Markdown into the requested format.

    args = parser.parse_args()

    # Prepare context
    context = {
        'projectName': args.project_name,
        'description': args.description,
        'domains': args.domains,
        'frameworks': args.frameworks,
        'architecture': args.architecture,
        'includeAI': args.include_ai
    }

    try:
        print(f"Generating documentation for {args.project_name}...")

        # Create output directory
        output_path = Path(args.output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Generate documentation
        result = run_ts_generator(str(output_path), context)

        if not result['success']:
            print(f"Error: {result.get('error', 'Unknown error')}")
            sys.exit(1)

        docs = result['docs']

        # Save generated documentation according to requested format
        fmt = getattr(args, 'format', 'markdown') if hasattr(args, 'format') else 'markdown'

        def write_file(name: str, content: str):
            # Always write markdown file first
            md_path = output_path / f"{name}.md"
            md_path.write_text(content)

            if fmt == 'markdown':
                return md_path

            # For other formats, prefer pandoc if available
            pandoc = shutil.which('pandoc')
            if not pandoc:
                print(f"⚠️  pandoc not found; falling back to writing markdown for {name}")
                return md_path

            out_ext = 'html' if fmt == 'html' else fmt
            out_path = output_path / f"{name}.{out_ext}"

            cmd = [pandoc, str(md_path), '-o', str(out_path)]
            try:
                subprocess.run(cmd, check=True)
                return out_path
            except subprocess.CalledProcessError as e:
                print(f"❌ pandoc conversion failed for {md_path}: {e}")
                return md_path

        # Write the main documentation files
        write_file('README', docs.get('readme', ''))
        write_file('ARCHITECTURE', docs.get('architectureGuide', ''))
        write_file('API-REFERENCE', docs.get('apiDocs', ''))

        print(f"✅ Documentation generated successfully in {output_path} (format: {fmt})")

        # Generate templates if requested
        if args.templates_dir:
            templates_path = Path(args.templates_dir)
            templates_path.mkdir(parents=True, exist_ok=True)

            # Run template generation
            template_result = subprocess.run([
                'node', '-e', f"""
const {{ DocumentationGenerator }} = require('./tools/docs/generator');
const fs = require('fs');

const context = {json.dumps(context)};
const generator = new DocumentationGenerator('{args.templates_dir}');

async function main() {{
    try {{
        await generator.generateAndSaveTemplates(context);
        console.log(JSON.stringify({{ success: true }}));
    }} catch (error) {{
        console.error(JSON.stringify({{ success: false, error: error.message }}));
        process.exit(1);
    }}
}}

main();
"""
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent.parent)

            if template_result.returncode == 0:
                print(f"✅ Templates generated successfully in {templates_path}")
            else:
                print(f"❌ Template generation failed: {template_result.stderr}")

        # Validate documentation if requested
        if args.validate:
            validation_result = subprocess.run([
                'node', '-e', f"""
const {{ DocumentationGenerator }} = require('./tools/docs/generator');

const docs = {json.dumps(docs)};
const outDir = {json.dumps(str(output_path))};
const generator = new DocumentationGenerator(outDir);

async function main() {{
    try {{
        const validation = await generator.validateDocumentation(docs);
        console.log(JSON.stringify(validation));
    }} catch (error) {{
        console.error(JSON.stringify({{ success: false, error: error.message }}));
        process.exit(1);
    }}
}}

main();
"""
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent.parent)

            if validation_result.returncode == 0:
                validation = json.loads(validation_result.stdout)
                if validation['isValid']:
                    print(f"✅ Documentation validation passed (score: {validation['score']:.2f})")
                else:
                    print(f"❌ Documentation validation failed:")
                    for section in validation['missingSection']:
                        print(f"  - Missing: {section}")
                    for warning in validation['warnings']:
                        print(f"  - Warning: {warning}")
            else:
                print(f"❌ Validation failed: {validation_result.stderr}")

        print("\n📖 Generated Documentation:")
        print(f"  - README.md: Project overview and getting started")
        print(f"  - ARCHITECTURE.md: Detailed architecture guide")
        print(f"  - API-REFERENCE.md: Complete API documentation")

    except Exception as e:
        print(f"❌ Error generating documentation: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
