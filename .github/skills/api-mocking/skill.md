---
name: API Mocking Skill
id: ce.skill.api-mocking
description: Scaffold API mocking infrastructure using Mountebank and Testcontainers for reliable integration testing.
version: 1.0.0
---

# API Mocking Skill

This skill automates the setup of API mocking infrastructure. It leverages `Mountebank` (for over-the-wire mocks) and `Testcontainers` (for ephemeral environment management) to create robust, hermetic integration tests.

## Commands

| Command                 | Description                                                       | Usage                   |
| :---------------------- | :---------------------------------------------------------------- | :---------------------- |
| `/vibepro.mock.init`    | Initialize mocking infrastructure (fixtures, dependencies check). | `/vibepro.mock.init`    |
| `/vibepro.mock.example` | Generate a reference implementation of a mock-backed test.        | `/vibepro.mock.example` |

## Usage Examples

### Initialize Mocking Support

```bash
/vibepro.mock.init
```

### Create Example Test

```bash
# This creates tests/integration/test_mock_example.py
/vibepro.mock.example
```
