from rest_framework.response import Response
from rest_framework import status as http_status


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
        response_data = {
            "success": is_success,
            "message": message,
            "result": result if result is not None else {},
        }
        return Response(response_data, status=status_code)
