from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback

logger = logging.getLogger(__name__)

def add_exception_handlers(app):
    """Add exception handlers to the FastAPI app"""
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "status_code": exc.status_code,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"Starlette HTTP exception: {exc.status_code} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "status_code": exc.status_code,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": "Validation failed",
                "details": exc.errors(),
                "status_code": 422,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {str(exc)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Don't expose internal errors in production
        error_message = "An unexpected error occurred. Please try again later."
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": error_message,
                "status_code": 500,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        logger.warning(f"Value error: {str(exc)}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": str(exc),
                "status_code": 400,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(KeyError)
    async def key_error_handler(request: Request, exc: KeyError):
        logger.warning(f"Key error: {str(exc)}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Invalid request format",
                "status_code": 400,
                "path": str(request.url.path)
            }
        )
    
    @app.exception_handler(PermissionError)
    async def permission_error_handler(request: Request, exc: PermissionError):
        logger.warning(f"Permission error: {str(exc)}")
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": "Permission denied",
                "status_code": 403,
                "path": str(request.url.path)
            }
        )
