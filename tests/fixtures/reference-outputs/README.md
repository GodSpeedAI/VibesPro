# Reference Output Specifications

This directory contains expected outputs for integration test validation.
These serve as golden files to ensure generated projects maintain quality.

## Structure

-   `hexagonal-project/` - Expected output for hexagonal architecture project
-   `ai-enabled-project/` - Expected output when AI workflows are enabled
-   `minimal-project/` - Expected output for minimal configuration
-   `performance-baseline.json` - Performance benchmark expectations

## Usage

Integration tests compare generated projects against these reference outputs
to ensure consistency and catch regressions in project generation.

## Maintenance

Update these reference outputs when:

1. Template structure changes are intentional
2. New features are added to generated projects
3. Performance targets are adjusted

Always review changes carefully to ensure they represent improvements,
not regressions in functionality.
