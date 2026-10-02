import json
import logging

from fastapi.testclient import TestClient

from main import app
from observability import JsonFormatter


class ListHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.records = []

    def emit(self, record):
        self.records.append(record)


def test_metrics_endpoint_counts_requests():
    with TestClient(app) as client:
        client.get("/items")
        response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text
    assert 'path="/items"' in response.text


def test_request_is_logged_with_structured_fields():
    handler = ListHandler()
    logger = logging.getLogger("restaurant_aid")
    logger.addHandler(handler)

    try:
        with TestClient(app) as client:
            response = client.get("/items", headers={"x-request-id": "test-123"})
    finally:
        logger.removeHandler(handler)
    assert response.headers["X-Request-ID"] == "test-123"
    records = [r for r in handler.records if r.getMessage() == "request"]
    assert records, "no request log was emitted"
    record = records[0]
    assert (record.method, record.path, record.status) == ("GET", "/items", 200)
    assert record.request_id == "test-123"


def test_json_formatter_outputs_valid_json():
    record = logging.LogRecord("restaurant_aid", logging.INFO, __file__, 1, "hello", (), None)
    record.status = 200
    data = json.loads(JsonFormatter().format(record))
    assert data["message"] == "hello"
    assert data["level"] == "INFO"
    assert data["status"] == 200
