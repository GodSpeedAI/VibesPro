#!/usr/bin/env python3
# mypy: ignore-errors
#!/usr/bin/env python3
"""Post-generation setup hook for Copier."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
from collections.abc import Iterable
from pathlib import Path
from typing import Any


def run(cmd: list[str], cwd: Path) -> None:
    """Run a subprocess, printing the command for visibility."""
    print(f"   → {' '.join(cmd)} (cwd={cwd})")
    subprocess.run(cmd, check=True, cwd=cwd)


def read_answers_file(path: Path) -> dict[str, Any]:
    """Read and parse a YAML answers file with robust error handling."""
    if not path.exists():
        return {}

    try:
        contents = path.read_text()
    except OSError as exc:  # noqa: BLE001
        print(f"   → Unable to read {path}: {exc}")
        return {}

    # PyYAML is required for this project and should always be available
    try:
        import yaml  # type: ignore

        # Use safe_load to prevent arbitrary code execution
        parsed = yaml.safe_load(contents) or {}

        if not isinstance(parsed, dict):
            print(f"   → {path}: YAML content is not a dictionary/object")
            return {}

        return parsed

    except ImportError:
        print("   → CRITICAL: PyYAML is not available. This is a required dependency.")
        print("   → Please install with: pip install pyyaml>=6.0")
        return {}
    except yaml.YAMLError as exc:
        print(f"   → Unable to parse {path}: {exc}")
        print("   → Note: The fallback parser is limited and only supports simple key:value pairs.")

        # Limited fallback for simple key:value pairs only
        if isinstance(contents, str) and ":" in contents:
            data: dict[str, Any] = {}
            for raw_line in contents.splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or ":" not in line:
                    continue
                try:
                    key, value = line.split(":", 1)
                    data[key.strip()] = value.strip().strip("\"'")
                except ValueError:
                    # Skip malformed lines
                    continue
            return data
        return {}
    except Exception as exc:  # noqa: BLE001
        print(f"   → Unexpected error parsing {path}: {exc}")
        return {}


def load_answers(target: Path) -> dict[str, Any]:
    """Load copier answers if PyYAML is available."""
    combined: dict[str, Any] = {}

    env_raw = os.environ.get("VIBESPRO_GENERATOR_CONTEXT")
    if env_raw:
        try:
            env_data = json.loads(env_raw)
            if isinstance(env_data, dict):
                combined.update(env_data)
        except json.JSONDecodeError as exc:
            print(f"   → Unable to parse VIBESPRO_GENERATOR_CONTEXT: {exc}")

    env_data_file = os.environ.get("VIBESPRO_GENERATOR_DATA_FILE")
    if env_data_file:
        combined.update(read_answers_file(Path(env_data_file)))

    for fname in (".copier-answers.yml", "copier-answers.yml"):
        answers_path = target / fname
        if not answers_path.exists():
            continue
        data = read_answers_file(answers_path)
        if data:
            combined.update(data)
            break
    return combined


def parse_domains(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        return [part.strip() for part in raw.split(",") if part.strip()]
    if isinstance(raw, Iterable):
        result: list[str] = []
        for item in raw:
            value = str(item).strip()
            if value:
                result.append(value)
        return result
    return []


def to_words(value: str) -> list[str]:
    return [segment for segment in re.split(r"[^a-zA-Z0-9]+", value) if segment]


def pascal_case(value: str, fallback: str = "Domain") -> str:
    words = to_words(value)
    if not words:
        return fallback
    return "".join(word.capitalize() for word in words)


def title_case_from_slug(value: str) -> str:
    words = to_words(value)
    if not words:
        return value.capitalize() if value else "Application"
    return " ".join(word.capitalize() for word in words)


def sanitize_for_platform_id(value: str) -> str:
    """
    Sanitize project slug for use in platform IDs (Android packages, iOS bundles).
    Converts to lowercase, replaces invalid characters, ensures valid segments.
    """
    if not value:
        return "app"

    # Convert to lowercase and replace invalid characters with dots
    sanitized = re.sub(r"[^a-zA-Z0-9.]", ".", value.lower())

    # Collapse consecutive dots
    sanitized = re.sub(r"\.+", ".", sanitized)

    # Trim leading and trailing dots
    sanitized = sanitized.strip(".")

    # Split into segments and validate each starts with a letter
    segments = []
    for segment in sanitized.split("."):
        if not segment:
            continue
        if not segment[0].isalpha():
            segment = f"app{segment}"
        segments.append(segment)

    # If no valid segments, use default
    if not segments:
        return "app"

    return ".".join(segments)


def sanitize_for_filesystem(value: str, fallback: str = "unnamed") -> str:
    """
    Sanitize a value for use in filesystem paths.
    Prevents path traversal and ensures safe characters only.
    """
    if not value:
        return fallback

    # Trim whitespace
    value = value.strip()
    if not value:
        return fallback

    # Reject path traversal attempts
    if ".." in value or value.startswith(".") or "/" in value or "\\" in value:
        return fallback

    # Allow only alphanumeric, hyphens, and underscores
    sanitized = re.sub(r"[^a-zA-Z0-9\-_]", "-", value)

    # Replace multiple hyphens/underscores with single hyphen
    sanitized = re.sub(r"[-_]+", "-", sanitized)

    # Trim leading/trailing hyphens
    sanitized = sanitized.strip("-")

    if not sanitized:
        return fallback

    return sanitized


def validate_within_target(target: Path, path_component: str, base_dir: str) -> Path:
    """
    Validate that a path component stays within the target directory.
    Returns a safe Path object or raises ValueError if validation fails.
    """
    safe_component = sanitize_for_filesystem(path_component)
    full_path = target / base_dir / safe_component

    # Resolve to absolute paths for comparison
    try:
        target_resolved = target.resolve()
        full_path_resolved = full_path.resolve()

        # Ensure the path is within target directory
        if not str(full_path_resolved).startswith(str(target_resolved)):
            raise ValueError(f"Path traversal detected: {path_component}")

        return full_path
    except (OSError, ValueError) as exc:
        raise ValueError(f"Invalid path component '{path_component}': {exc}") from exc


def sanitize_domain_name(value: str, target: Path) -> Path:
    """
    Sanitize domain name and validate it's within target/libs.
    """
    if not value:
        raise ValueError("Domain name cannot be empty")

    # Trim and lowercase
    value = value.strip().lower()

    # Use strict pattern: alphanumeric, hyphen, underscore only
    if not re.match(r"^[a-z0-9\-_]+$", value):
        raise ValueError(
            f"Domain name '{value}' contains invalid characters. Only alphanumeric, hyphens, and underscores allowed."
        )

    return validate_within_target(target, value, "libs")


def sanitize_service_name(value: str, target: Path) -> Path:
    """
    Sanitize service name and validate it's within target/apps.
    """
    if not value:
        raise ValueError("Service name cannot be empty")

    # Trim and validate characters
    value = value.strip()

    # Reject path separators, "..", leading dots
    if any(char in value for char in ["/", "\\", ".."]) or value.startswith("."):
        raise ValueError(f"Service name '{value}' contains invalid path characters")

    # Allow only alphanumerics, dashes, underscores
    if not re.match(r"^[a-zA-Z0-9\-_]+$", value):
        raise ValueError(
            f"Service name '{value}' contains invalid characters. Only alphanumeric, hyphens, and underscores allowed."
        )

    # Enforce max length
    if len(value) > 50:
        raise ValueError(f"Service name '{value}' is too long (max 50 characters)")

    return validate_within_target(target, value, "apps")


def sanitize_app_name(value: str, target: Path) -> Path:
    """
    Sanitize app name and validate it's within target/apps.
    """
    if not value:
        raise ValueError("App name cannot be empty")

    return validate_within_target(target, value, "apps")


def sanitize_project_slug(value: str) -> str:
    """
    Sanitize project slug for general use in paths and identifiers.
    """
    if not value:
        return "project"

    # Convert to lowercase and replace invalid characters with dashes
    sanitized = re.sub(r"[^a-zA-Z0-9\-]", "-", value.lower())

    # Replace multiple dashes with single dash
    sanitized = re.sub(r"-+", "-", sanitized)

    # Trim leading/trailing dashes
    sanitized = sanitized.strip("-")

    if not sanitized:
        return "project"

    return sanitized


def sanitize_domains(domains: list[str]) -> list[str]:
    """
    Sanitize a list of domain names to ensure they are safe.
    """
    sanitized_domains = []
    for domain in domains:
        # Trim and lowercase
        domain = domain.strip().lower()

        # Use strict pattern: alphanumeric, hyphen, underscore only
        if re.match(r"^[a-z0-9\-_]+$", domain):
            sanitized_domains.append(domain)
        else:
            # Skip invalid domains or replace with sanitized version
            safe_domain = re.sub(r"[^a-z0-9\-_]", "-", domain)
            if safe_domain:
                sanitized_domains.append(safe_domain.strip("-"))

    # Remove duplicates and empty strings
    return list(dict.fromkeys([d for d in sanitized_domains if d]))


def write_text_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def build_api_client(domains: list[str]) -> str:
    domain_literal = ", ".join(f'"{domain}"' for domain in domains) or '"core"'
    return textwrap.dedent(
        f"""\
        export const DOMAIN_REGISTRY = [{domain_literal}];

        export class DomainName {{
          constructor(public readonly value: string) {{
            if (!DOMAIN_REGISTRY.includes(value)) {{
              throw new Error(`Unknown domain: ${{value}}`);
            }}
          }}
        }}

        export function listDomains(): DomainName[] {{
          return DOMAIN_REGISTRY.map((domain) => new DomainName(domain));
        }}
        """
    )


def scaffold_app(target: Path, answers: dict[str, Any]) -> None:
    """Scaffold an app with comprehensive input validation and sanitization."""
    # Sanitize and validate app_name
    app_name_raw = str(answers.get("app_name") or answers.get("name") or "").strip()
    if not app_name_raw:
        return

    try:
        app_root = sanitize_app_name(app_name_raw, target)
    except ValueError as exc:
        print(f"   → Skipping app scaffold: {exc}")
        return

    framework = str(answers.get("app_framework") or "next").lower()

    # Sanitize domains list
    domains_raw = parse_domains(answers.get("app_domains") or answers.get("domains"))
    if not domains_raw:
        domains_raw = ["core"]
    domains = sanitize_domains(domains_raw)
    if not domains:
        domains = ["core"]  # Fallback if all domains were invalid

    include_example = bool(answers.get("include_example_page"))
    include_supabase = bool(answers.get("include_supabase"))
    router_style = str(answers.get("app_router_style") or "pages").lower()

    # Sanitize project_slug
    project_slug_raw = str(answers.get("project_slug") or app_name_raw or "app")
    project_slug = sanitize_project_slug(project_slug_raw)

    # Get the sanitized app name for use in configs
    app_name = app_root.name

    app_title = title_case_from_slug(app_name_raw)

    app_root.mkdir(parents=True, exist_ok=True)

    api_client_content = build_api_client(domains)
    write_text_file(app_root / "lib" / "api-client.ts", api_client_content)

    if framework == "remix":
        write_text_file(app_root / "app" / "lib" / "api-client.ts", api_client_content)
    elif framework == "expo":
        # Expo relies on the shared lib as well; already written.
        pass

    domains_display = ", ".join(domains)
    sections: list[str] = [
        f"      <p>Domains available: {domains_display or 'core'}.</p>",
    ]
    if include_example:
        sections.append(
            "      <section>\n"
            "        <h2>Example Domain Integration</h2>\n"
            "        <p>ExampleEntity demonstrates integration across domains.</p>\n"
            "      </section>"
        )
    if include_supabase:
        sections.append(
            "      <section>\n"
            "        <p>Supabase integration detected via environment configuration.</p>\n"
            "      </section>"
        )
    body_sections = "\n".join(sections)

    if framework == "next":
        next_index = (
            "import Head from 'next/head';\n\n"
            f"const domains = {json.dumps(domains)};\n\n"
            "export default function Home() {\n"
            "  return (\n"
            "    <main>\n"
            f"      <h1>Welcome to {app_title}</h1>\n"
            f"{body_sections}\n"
            "    </main>\n"
            "  );\n"
            "}\n"
        )
        write_text_file(app_root / "pages" / "index.tsx", next_index)

        next_config = textwrap.dedent(
            f"""\
            /** @type {{import('next').NextConfig}} */
            const nextConfig = {{
              experimental: {{
                appDir: {str(router_style == 'app').lower()},
              }},
              env: {{
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
              }},
            }};

            module.exports = nextConfig;
            """
        )
        write_text_file(app_root / "next.config.js", next_config)

    if framework == "remix":
        remix_index = (
            "import type { MetaFunction } from '@remix-run/node';\n\n"
            "export const meta: MetaFunction = () => ([\n"
            f"  {{ title: '{app_title}' }},\n"
            "]);\n\n"
            "export default function Index() {\n"
            "  return (\n"
            "    <main>\n"
            f"      <h1>Welcome to {app_title}</h1>\n"
            f"{body_sections}\n"
            "    </main>\n"
            "  );\n"
            "}\n"
        )
        write_text_file(app_root / "app" / "routes" / "index.tsx", remix_index)

        remix_config = textwrap.dedent(
            f"""\
            const config = {{
              appDirectory: "apps/{app_name}/app",
              browserBuildDirectory: "apps/{app_name}/public/build",
              serverBuildDirectory: "apps/{app_name}/build",
              ignoredRouteFiles: ["**/*.test.*"],
            }};

            module.exports = config;
            """
        )
        write_text_file(app_root / "remix.config.js", remix_config)

    if framework == "expo":
        expo_sections: list[str] = [
            f"        <Text>Domains available: {domains_display or 'core'}.</Text>",
        ]
        if include_example:
            expo_sections.append(
                "        <Text>Example Domain Integration showcases ExampleEntity.</Text>"
            )
        if include_supabase:
            expo_sections.append("        <Text>Supabase integration detected.</Text>")
        expo_body = "\n".join(expo_sections)

        expo_app = (
            "import { SafeAreaView, Text, View } from 'react-native';\n\n"
            "export default function App() {\n"
            "  return (\n"
            "    <SafeAreaView>\n"
            "      <View style={{ padding: 24 }}>\n"
            f"        <Text>Welcome to {app_title}</Text>\n"
            f"{expo_body}\n"
            "      </View>\n"
            "    </SafeAreaView>\n"
            "  );\n"
            "}\n"
        )
        write_text_file(app_root / "App.tsx", expo_app)

        # Sanitize project_slug for platform IDs
        platform_safe_slug = sanitize_for_platform_id(project_slug)

        expo_config = {
            "expo": {
                "name": app_title,
                "slug": app_name,
                "version": "1.0.0",
                "owner": project_slug,
                "android": {"package": f"com.{platform_safe_slug}.mobile-app"},
                "ios": {"bundleIdentifier": f"com.{platform_safe_slug}.mobile-app"},
            }
        }
        write_text_file(app_root / "app.json", json.dumps(expo_config, indent=2))


def scaffold_domain(target: Path, answers: dict[str, Any]) -> None:
    """Scaffold a domain with comprehensive input validation and sanitization."""
    domain_name_raw = str(answers.get("domain_name") or "").strip()
    if not domain_name_raw:
        return

    try:
        domain_root = sanitize_domain_name(domain_name_raw, target)
    except ValueError as exc:
        print(f"   → Skipping domain scaffold: {exc}")
        return

    # Get the sanitized domain name for use in configs
    domain_name = domain_root.name

    words = to_words(domain_name_raw)
    primary_pascal = words[0].capitalize() if words else "Domain"
    domain_pascal = pascal_case(domain_name_raw)

    tsconfig = {
        "extends": "../../tsconfig.base.json",
        "compilerOptions": {
            "target": "ES2021",
            "module": "commonjs",
            "esModuleInterop": True,
            "forceConsistentCasingInFileNames": True,
            "strict": True,
        },
        "include": ["./**/*.ts"],
    }
    write_text_file(domain_root / "tsconfig.json", json.dumps(tsconfig, indent=2))

    project_template = {
        "$schema": "../../node_modules/nx/schemas/project-schema.json",
        "projectType": "library",
        "targets": {},
        "tags": [f"domain:{domain_name}"],
    }
    write_text_file(
        domain_root / "project.json",
        json.dumps({**project_template, "name": domain_name}, indent=2),
    )
    write_text_file(
        domain_root / "domain" / "project.json",
        json.dumps(
            {
                **project_template,
                "name": f"{domain_name}-domain",
                "sourceRoot": f"libs/{domain_name}/domain/src",
            },
            indent=2,
        ),
    )
    write_text_file(
        domain_root / "application" / "project.json",
        json.dumps(
            {
                **project_template,
                "name": f"{domain_name}-application",
                "sourceRoot": f"libs/{domain_name}/application/src",
            },
            indent=2,
        ),
    )
    write_text_file(
        domain_root / "infrastructure" / "project.json",
        json.dumps(
            {
                **project_template,
                "name": f"{domain_name}-infrastructure",
                "sourceRoot": f"libs/{domain_name}/infrastructure/src",
            },
            indent=2,
        ),
    )

    entity_names = {primary_pascal, domain_pascal}
    for entity in entity_names:
        entity_content = textwrap.dedent(
            f"""\
            export class {entity} {{
              constructor(public readonly id: string) {{}}
            }}
            """
        )
        write_text_file(domain_root / "domain" / "entities" / f"{entity}.ts", entity_content)

    vo_name = f"{primary_pascal}Id"
    value_object = textwrap.dedent(
        f"""\
        export class {vo_name} {{
          constructor(public readonly value: string) {{
            if (!value) {{
              throw new Error('{vo_name} cannot be empty');
            }}
          }}
        }}
        """
    )
    write_text_file(domain_root / "domain" / "value-objects" / f"{vo_name}.ts", value_object)

    event_name = f"{primary_pascal}Created"
    event_content = textwrap.dedent(
        f"""\
        import {{ {vo_name} }} from '../value-objects/{vo_name}';

        export interface {event_name} {{
          type: '{event_name}';
          payload: {{
            id: {vo_name};
          }};
        }}
        """
    )
    write_text_file(domain_root / "domain" / "events" / f"{event_name}.ts", event_content)

    create_use_case = textwrap.dedent(
        f"""\
        import type {{ {event_name} }} from '../../domain/events/{event_name}';
        import {{ {primary_pascal} }} from '../../domain/entities/{primary_pascal}';

        export class Create{primary_pascal} {{
          execute(name: string): {event_name} {{
            const entity = new {primary_pascal}(name);
            return {{
              type: '{event_name}',
              payload: {{
                id: {{ value: entity.id }},
              }},
            }};
          }}
        }}
        """
    )
    write_text_file(
        domain_root / "application" / "use-cases" / f"Create{primary_pascal}.ts", create_use_case
    )

    repository_interface = textwrap.dedent(
        f"""\
        import type {{ {primary_pascal} }} from '../../domain/entities/{primary_pascal}';

        export interface {primary_pascal}Repository {{
          findById(id: string): Promise<{primary_pascal} | null>;
          save(entity: {primary_pascal}): Promise<void>;
        }}
        """
    )
    write_text_file(
        domain_root / "application" / "ports" / f"{primary_pascal}Repository.ts",
        repository_interface,
    )

    repository_adapter = textwrap.dedent(
        f"""\
        import type {{ {primary_pascal} }} from '../../domain/entities/{primary_pascal}';
        import type {{ {primary_pascal}Repository }} from '../../application/ports/{primary_pascal}Repository';

        export class {primary_pascal}RepositoryAdapter implements {primary_pascal}Repository {{
          async findById(id: string): Promise<{primary_pascal} | null> {{
            return null;
          }}

          async save(entity: {primary_pascal}): Promise<void> {{
            console.info('Persisting entity', entity);
          }}
        }}
        """
    )
    write_text_file(
        domain_root / "infrastructure" / "repositories" / f"{primary_pascal}Repository.ts",
        repository_adapter,
    )

    adapter_content = textwrap.dedent(
        f"""\
        import {{ Create{primary_pascal} }} from '../../application/use-cases/Create{primary_pascal}';

        export class {primary_pascal}Adapter {{
          private readonly useCase = new Create{primary_pascal}();

          bootstrap(name: string) {{
            return this.useCase.execute(name);
          }}
        }}
        """
    )
    write_text_file(
        domain_root / "infrastructure" / "adapters" / f"{primary_pascal}Adapter.ts", adapter_content
    )


def scaffold_service(target: Path, answers: dict[str, Any]) -> None:
    """Scaffold a service with comprehensive input validation and sanitization."""
    service_name_raw = str(answers.get("name") or answers.get("service_name") or "").strip()
    if not service_name_raw:
        return

    language = str(answers.get("language") or "python").lower()
    if language != "python":
        return

    try:
        service_root = sanitize_service_name(service_name_raw, target)
    except ValueError as exc:
        print(f"   → Skipping service scaffold: {exc}")
        return

    # Get the sanitized service name for use in configs
    service_name = service_root.name

    main_py = textwrap.dedent(
        f"""\
        from fastapi import FastAPI

        from libs.python.vibepro_logging import (
            LogCategory,
            bootstrap_logfire,
            configure_logger,
        )


        app = FastAPI(
            title="{service_name}",
            description="A service for {service_name}",
            version="0.1.0",
        )

        bootstrap_logfire(app, service="{service_name}")
        logger = configure_logger("{service_name}")


        @app.get("/")
        def read_root() -> dict[str, str]:
            logger.info("service health check", category=LogCategory.APP)
            return {{"message": "Hello from {service_name}"}}
        """
    )
    write_text_file(service_root / "main.py", main_py)


def apply_generator_outputs(target: Path, answers: dict[str, Any]) -> None:
    generator_type = str(answers.get("generator_type") or "").strip().lower()
    if not generator_type:
        return

    print(f"🛠️  Applying generator scaffolding for '{generator_type}'")

    if generator_type == "app":
        scaffold_app(target, answers)
    elif generator_type == "domain":
        scaffold_domain(target, answers)
    elif generator_type == "service":
        scaffold_service(target, answers)


def generate_types(target: Path) -> None:
    """Generate cross-language types from a central schema."""
    print("🧬 Generating cross-language types...")
    type_generator_dir = target / "tools" / "type-generator"
    schema_path = target / "temporal_db" / "schema.json"
    ts_output_dir = target / "libs" / "shared" / "database-types"

    # Check if type generator exists in generated project
    if not type_generator_dir.exists():
        print(f"   → Type generator not found at {type_generator_dir}, skipping type generation.")
        return

    if not schema_path.parent.exists():
        print("   → Temporal database assets not found, skipping type generation.")
        return
    # Ensure a schema file exists to avoid errors
    if not schema_path.exists():
        print(f"   → Schema file not found at {schema_path}, creating a dummy file.")
        schema_path.parent.mkdir(parents=True, exist_ok=True)
        schema_path.write_text('{"tables": []}')

    cmd = [
        "node",
        "cli.js",
        "generate",
        str(schema_path),
        "--output-dir",
        str(ts_output_dir),
    ]

    # Note: The type-generator CLI produces TypeScript artifacts only.
    # It does not generate Python types — run the project's Python type-generation
    # step separately if Python artifacts are required (e.g. `just types-generate`).
    run(cmd, cwd=type_generator_dir)


def _is_hardening_enabled(target: Path, answers: dict[str, Any] | None = None) -> bool:
    """Check if security hardening is enabled via env var or answers file."""
    env_val = os.environ.get("COPIER_ENABLE_SECURITY_HARDENING")
    if env_val is not None:
        return str(env_val).lower() in ("1", "true", "yes")

    if answers is None:
        answers = load_answers(target)

    if isinstance(answers, dict) and "enable_security_hardening" in answers:
        return bool(answers.get("enable_security_hardening"))

    return False


def cleanup_security_assets(target: Path, answers: dict[str, Any] | None = None) -> None:
    if _is_hardening_enabled(target, answers):
        return

    sec_dir = target / "libs" / "security"
    if sec_dir.exists():
        print("   → Security hardening disabled: removing libs/security from generated project")
        shutil.rmtree(sec_dir, ignore_errors=True)


def setup_generated_project(target: Path) -> None:
    """Run initial setup commands inside the generated project."""
    answers = load_answers(target)
    apply_generator_outputs(target, answers)

    skip_setup = os.environ.get("COPIER_SKIP_PROJECT_SETUP") == "1"
    uv_no_sync = os.environ.get("UV_NO_SYNC") == "1"

    if skip_setup:
        print("⚠️ Skipping install/build steps (COPIER_SKIP_PROJECT_SETUP=1)")
        cleanup_security_assets(target, answers)
        return

    print("🔧 Setting up generated project...")
    generate_types(target)

    # Check if pnpm is available before trying to install
    try:
        run(["pnpm", "install"], cwd=target)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"   → pnpm install failed: {e}")
        print("   → Continuing without Node.js setup...")

    # Only run uv sync if there's an actual Python package structure and UV_NO_SYNC is not set
    # Python apps are generated via Nx (@nxlv/python) after template initialization
    python_packages = list(target.glob("*/__init__.py")) or list(target.glob("src/*/__init__.py"))
    if python_packages and not uv_no_sync:
        try:
            run(["uv", "sync", "--dev"], cwd=target)
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"   → uv sync failed: {e}")
            print("   → Continuing without Python setup...")
    elif uv_no_sync:
        print("   → Skipping uv sync (UV_NO_SYNC=1)")
    else:
        print("   → Skipping uv sync (no Python package found - generate via Nx later)")

    # Check if just is available before trying to build
    try:
        run(["just", "build"], cwd=target)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"   → just build failed: {e}")
        print("   → Continuing without build step...")

    cleanup_security_assets(target, answers)

    print("✅ Project setup completed successfully!")
    print()
    print("🚀 Next steps:")
    print("  1. cd into your project directory")
    print("  2. Run 'just dev' to start development")
    print("  3. Run 'just test' to execute the full test suite")
    print("  4. Review the generated README.md for more guidance")
    print()
    print("📝 Optional: Refine Project Context for AI Copilot")
    print("   As your project evolves, update the AI context description:")
    print("   @workspace .github/prompts/project.describe-context.prompt.md")
    print("   This helps Copilot understand your specific business domain.")


def main() -> None:
    print("🎉 Project generated successfully!")
    target = Path.cwd()

    try:
        setup_generated_project(target)
    except subprocess.CalledProcessError as exc:
        print(f"❌ Setup failed: {exc}")
        sys.exit(exc.returncode or 1)
    except FileNotFoundError as exc:
        print(f"❌ Required tool not found: {exc}")
        print("Please ensure pnpm, uv, and just are installed in your environment.")
        sys.exit(1)


if __name__ == "__main__":
    main()
