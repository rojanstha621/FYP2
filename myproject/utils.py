from rest_framework.response import Response
from rest_framework import status as http_status


def api_response(data=None, message="", status_code=http_status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def api_error(
    message="",
    code="error",
    details=None,
    status_code=http_status.HTTP_400_BAD_REQUEST,
):
    return Response(
        {
            "success": False,
            "message": message,
            "code": code,
            "details": details or {},
        },
        status=status_code,
    )


class APIResponse:
    """
    Simple custom API response utility.

    Response structure:
    {
        "success": true/false,
        "message": "response message",
        "result": {} or []
    }
    """

    @staticmethod
    def send(
        is_success=True, message="", result=None, status_code=http_status.HTTP_200_OK
    ):
        """
        Returns a standardized API response.

        Args:
            is_success (bool): Whether the request was successful
            message (str): Response message
            result (dict/list): Response data
            status_code (int): HTTP status code

        Returns:
            Response: DRF Response object
        """
        if is_success:
            return api_response(data=result, message=message, status_code=status_code)

        return api_error(message=message, status_code=status_code)
