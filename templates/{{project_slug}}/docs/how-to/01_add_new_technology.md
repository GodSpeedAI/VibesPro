# How-To: Add a New Technology to the Project Stack

This guide explains how to add a new dependency, library, or tool to the project using the `techstack.yaml` workflow. This process ensures that the technology is officially recognized by the project's automation and documentation systems.

## Prerequisites

-   A clear understanding of which category the new technology belongs to. Refer to the `docs/reference/02_techstack_yaml_format.md` documentation if you are unsure.

## Step 1: Add the Technology to `techstack.yaml`

1.  Open the `techstack.yaml` file in the root of the project.
2.  Locate the appropriate category and sub-category for your new technology.
3.  Add the new item to the list. Include a brief, commented description of its purpose.

**Example:** Adding a new data processing library.

```yaml
# techstack.yaml

utility_helper_dependencies:
    # ... other sections
    data_processing:
        - pandas # structured data manipulation (optional)
        - pyarrow # columnar data + interoperability
        - polars # new, fast data manipulation library
```

## Step 2: Preview the Changes (Recommended)

Before applying the changes, it's a good practice to preview what effect they will have. The `plan-techstack` command will show you a diff of the generated files without actually modifying them.

Run the following command from the project root:

```bash
just plan-techstack
```

Review the output to ensure the changes are what you expect.

## Step 3: Apply the Changes

Once you are satisfied with the plan, apply the changes to the project. The `sync-techstack` command will run the automation scripts to update any derived configuration files or documentation.

Run the following command from the project root:

```bash
just sync-techstack
```

## Step 4: Verify the Changes

After the sync command completes, you should verify that the project has been updated correctly. This might involve:

-   Checking for changes in generated JSON files.
-   Ensuring new dependencies are available to be installed.
-   Seeing updated documentation, if applicable.

You have now successfully added a new technology to the project stack.
