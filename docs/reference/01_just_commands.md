# Reference: `just` Commands

This project uses `just` as a command runner to provide a simple and consistent interface for common tasks. Below is a reference for the available commands.

---

### `just plan-techstack [ts=<path>]`

**Description:**
Previews the changes that would be made to the project based on the contents of the `techstack.yaml` file. This command is for planning and does not write any files. It shows a diff of the potential changes.

**Arguments:**

- `ts=<path>` (optional): The path to the tech stack YAML file. Defaults to `techstack.yaml` in the project root.

**Example:**

```bash
just plan-techstack
```

---

### `just sync-techstack [ts=<path>]`

**Description:**
Applies the changes defined in the `techstack.yaml` file to the project. This command reads the YAML file and generates or updates derived configuration files (e.g., a resolved JSON representation of the stack).

**Arguments:**

- `ts=<path>` (optional): The path to the tech stack YAML file. Defaults to `techstack.yaml`.

**Example:**

```bash
just sync-techstack
```

---

### `just sync-techstack-dry [ts=<path>]`

**Description:**
Performs a "dry run" of the `sync-techstack` command. It shows the changes that would be applied but does not write any files. This is useful for verifying the changes before committing them.

**Arguments:**

- `ts=<path>` (optional): The path to the tech stack YAML file. Defaults to `techstack.yaml`.

**Example:**

```bash
just sync-techstack-dry
```
