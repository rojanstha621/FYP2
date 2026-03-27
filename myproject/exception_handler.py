import logging

from rest_framework import status
from rest_framework.exceptions import (
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


logger = logging.getLogger(__name__)


def _extract_message(data, default_message):
    if isinstance(data, dict):
        detail = data.get("detail")
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list) and detail:
            return str(detail[0])
        for _, value in data.items():
            if isinstance(value, list) and value:
                return str(value[0])
            if isinstance(value, str):
                return value
            if isinstance(value, dict):
                nested_message = _extract_message(value, None)
                if nested_message:
                    return nested_message
    elif isinstance(data, list) and data:
        return str(data[0])
    elif isinstance(data, str):
        return data
    return default_message


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is not None:
        details = response.data

        if isinstance(exc, ValidationError):
            code = "validation_error"
            message = _extract_message(details, "Validation failed.")
        elif isinstance(exc, NotFound):
            code = "not_found"
            message = _extract_message(details, "Resource not found.")
        elif isinstance(exc, PermissionDenied):
            code = "permission_denied"
            message = _extract_message(details, "You do not have permission to perform this action.")
        elif isinstance(exc, NotAuthenticated):
            code = "not_authenticated"
            message = _extract_message(details, "Authentication credentials were not provided.")
        else:
            code = getattr(exc, "default_code", "api_error")
            message = _extract_message(details, "Request failed.")

        response.data = {
            "error": True,
            "message": message,
            "code": str(code),
            "details": details,
        }
        return response

    logger.exception("Unhandled exception in API view", exc_info=exc)

    return Response(
        {
            "error": True,
            "message": "An unexpected error occurred.",
            "code": "internal_server_error",
            "details": [],
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
