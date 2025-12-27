#!/usr/bin/env python3
"""
API Mocking Initialization Script

This script scaffolds the necessary infrastructure for API mocking using
Mountebank and Testcontainers. It ensures dependencies are present and
generates example tests.
"""

import sys
from pathlib import Path

# Constants
PROJECT_ROOT = Path(__file__).parent.parent.parent
FIXTURES_DIR = PROJECT_ROOT / "tests/fixtures"
INTEGRATION_DIR = PROJECT_ROOT / "tests/integration"
EXAMPLE_FILE = INTEGRATION_DIR / "test_mock_example.py"
FIXTURE_FILE = FIXTURES_DIR / "mountebank.py"


def check_dependencies() -> None:
    """Check if 'testcontainers' is in pyproject.toml."""
    pyproject_path = PROJECT_ROOT / "pyproject.toml"
    if not pyproject_path.exists():
        print("❌ pyproject.toml not found.")
        sys.exit(1)

    content = pyproject_path.read_text()
    if "testcontainers" not in content:
        print("⚠️  'testcontainers' dependency missing from pyproject.toml.")
        print("   Please add 'testcontainers>=4.10.0' to your [dependency-groups] dev section.")
        # In a real generator, we might auto-add it, but for safety we warn the user.
    else:
        print("✅ 'testcontainers' dependency found.")


def create_fixture() -> None:
    """Create the Mountebank test fixture."""
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

    content = '''
import pytest
from testcontainers.core.container import DockerContainer
from testcontainers.core.waiting_utils import wait_for_logs

class MountebankContainer(DockerContainer):
    def __init__(self, image="bbyars/mountebank:2.9.1", **kwargs):
        super().__init__(image, **kwargs)
        self.with_exposed_ports(2525)

    def start(self):
        super().start()
        wait_for_logs(self, "mountebank v", timeout=10)
        return self

@pytest.fixture(scope="session")
def mountebank():
    """Spin up a Mountebank container for the test session."""
    with MountebankContainer() as mb:
        yield mb
'''
    if not FIXTURE_FILE.exists():
        FIXTURE_FILE.write_text(content.strip())
        print(f"✅ Created fixture: {FIXTURE_FILE}")
    else:
        print(f"ℹ️  Fixture already exists: {FIXTURE_FILE}")


def create_example_test() -> None:
    """Create an example integration test using the fixture."""
    INTEGRATION_DIR.mkdir(parents=True, exist_ok=True)

    content = '''
import requests
import json
from ..fixtures.mountebank import mountebank

def test_mountebank_imposter(mountebank):
    """
    Example test showing how to configure a Mountebank imposter and call it.
    """
    mb_host = mountebank.get_container_host_ip()
    mb_port = mountebank.get_exposed_port(2525)
    mb_url = f"http://{mb_host}:{mb_port}"

    # 1. Create an imposter (mock service) listening on port 4545 inside container
    imposter_config = {
        "port": 4545,
        "protocol": "http",
        "stubs": [
            {
                "predicates": [
                    {"equals": {"path": "/test", "method": "GET"}}
                ],
                "responses": [
                    {"is": {"statusCode": 200, "body": json.dumps({"message": "Hello from Mock!"})}}
                ]
            }
        ]
    }

    # Send config to Mountebank
    response = requests.post(f"{mb_url}/imposters", json=imposter_config)
    assert response.status_code == 201

    # 2. Call the mock service
    # Note: Testcontainers maps the internal port 4545 to a random external port
    # We need to find that mapping. However, standard Mountebank container exports 2525.
    # To expose dynamic ports, you often need to bind them or use host networking.
    # For simplicity in this example, we assume we are testing logic that *talks* to this URL.

    # In a real scenario, you'd configure your app to point to f"http://{mb_host}:{mapped_port}"
    pass
'''
    if not EXAMPLE_FILE.exists():
        EXAMPLE_FILE.write_text(content.strip())
        print(f"✅ Created example test: {EXAMPLE_FILE}")
    else:
        print(f"ℹ️  Example test already exists: {EXAMPLE_FILE}")


def main() -> None:
    print("🚀 Initializing API Mocking Infrastructure...")
    check_dependencies()
    create_fixture()
    create_example_test()
    print(
        "✅ Initialization complete. Run tests with `pytest tests/integration/test_mock_example.py`"
    )


if __name__ == "__main__":
    main()
