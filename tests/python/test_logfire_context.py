from unittest.mock import patch

from libs.python import vibepro_logging
from libs.python.vibepro_logging import get_logger


@patch("libs.python.vibepro_logging.logfire")
def test_get_logger_binds_context(mock_logfire):
    """
    RED: This test should fail.
    Asserts that get_logger returns a Logfire-bound logger
    with the correct environment and application_version.
    This fulfills the "Red" step of TDD Cycle 2B.
    """
    # Configure the mock to simulate Logfire's logger structure
    mock_logger = mock_logfire.configure.return_value
    mock_scoped_logger = mock_logger.with_settings.return_value

    # Reset cached state to ensure configure() is invoked in this test
    vibepro_logging._LOGFIRE_INSTANCE = None

    # Call the function under test
    logger = get_logger()

    # Assert that the logger was configured and scoped with the correct context
    mock_logfire.configure.assert_called_once()
    mock_logger.with_settings.assert_called_once_with(
        tags=("service:vibepro-py", "environment:local", "application_version:dev"),
    )
    assert logger == mock_scoped_logger
