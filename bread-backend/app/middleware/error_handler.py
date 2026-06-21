from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import traceback
import logging

logger = logging.getLogger("bread_api")

class ErrorHandlerMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        try:
            response = await self.app(scope, receive, send)
            return response

        except HTTPException as exc:
            logger.warning(f"HTTPException: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": exc.detail}
            )

        except Exception as exc:
            tb = traceback.format_exc()
            logger.error(f"Unhandled error: {exc}\n{tb}")

            return JSONResponse(
                status_code=500,
                content={"error": "Internal server error"}
            )
