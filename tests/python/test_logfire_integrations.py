
import pytest
import requests
from pydantic import BaseModel
from unittest.mock import patch

from libs.python.vibepro_logging import instrument_integrations

@patch('libs.python.vibepro_logging.logfire')
def test_requests_instrumentation(mock_logfire):
    """
    Asserts that requests instrumentation emits spans.
    """
    instrument_integrations(requests=True)
    mock_logfire.instrument_requests.assert_called_once()

    with patch('requests.get') as mock_get:
        requests.get("https://example.com")
        mock_get.assert_called_once()

@patch('libs.python.vibepro_logging.logfire')
def test_pydantic_instrumentation(mock_logfire):
    """
    Asserts that pydantic instrumentation is enabled.
    """
    instrument_integrations(pydantic=True)
    mock_logfire.instrument_pydantic.assert_called_once()

    class MyModel(BaseModel):
        x: int

    MyModel(x=1)
