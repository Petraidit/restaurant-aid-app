import json
import logging
import sys
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

REQUESTS = Counter("http_requests_total", "HTTP requests", ["method", "path", "status"])
LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request latency in seconds", ["method", "path"]
)

# Probes hit these every few seconds; counting them is fine, logging them is noise.
SKIP_LOG = {"/health", "/metrics"}

_STANDARD = set(logging.LogRecord("", 0, "", 0, "", (), None).__dict__) | {"message", "asctime", "color_message"}


class JsonFormatter(logging.Formatter):
    """One JSON object per log line, including any extra fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key not in _STANDARD:
                payload[key] = value
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    for name in ("restaurant_aid", "uvicorn", "uvicorn.error"):
        logger = logging.getLogger(name)
        logger.handlers = [handler]
        logger.setLevel(logging.INFO)
        logger.propagate = False


def setup_observability(app: FastAPI) -> None:
    setup_logging()
    log = logging.getLogger("restaurant_aid.access")

    @app.middleware("http")
    async def observe(request: Request, call_next):
        request_id = (request.headers.get("x-request-id") or uuid.uuid4().hex)[:64]
        start = time.perf_counter()
        status = 500
        try:
            response = await call_next(request)
            status = response.status_code
            response.headers["X-Request-ID"] = request_id
            return response

        finally:
            duration = time.perf_counter() - start
            route = request.scope.get("route")
            # Use the route template, not the raw URL, so metric labels stay bounded.
            route_path = route.path if route else "unmatched"
            if route_path != "/metrics":
                REQUESTS.labels(request.method, route_path, str(status)).inc()
                LATENCY.labels(request.method, route_path).observe(duration)
            if request.url.path not in SKIP_LOG:
                log.info(
                    "request",
                    extra={
                        "method": request.method,
                        "path": request.url.path,
                        "status": status,
                        "duration_ms": round(duration * 1000, 1),
                        "request_id": request_id,
                    },
                )

    @app.get("/metrics", include_in_schema=False)
    def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
