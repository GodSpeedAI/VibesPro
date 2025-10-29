from unittest.mock import patch

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
    mock_logger = mock_logfire.get_logger.return_value
    mock_bound_logger = mock_logger.bind.return_value

    # Call the function under test
    logger = get_logger()

    # Assert that the logger was retrieved and bound with the correct context
    mock_logfire.get_logger.assert_called_once()
    mock_logger.bind.assert_called_once_with(
        service="vibepro-py", environment="local", application_version="dev"
    )
    assert logger == mock_bound_logger
