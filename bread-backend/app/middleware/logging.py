import time
import logging
from fastapi import Request

logger = logging.getLogger("bread_api")

class LoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        start = time.time()

        logger.info(f"➡️ {request.method} {request.url.path}")

        response = await self.app(scope, receive, send)

        duration = round((time.time() - start) * 1000, 2)
        logger.info(f"⬅️ {request.method} {request.url.path} ({duration}ms)")

        return response
