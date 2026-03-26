from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SessionViewSet, SetLogViewSet

router = DefaultRouter()
router.register(r"sessions", SessionViewSet, basename="session")
router.register(r"setlogs", SetLogViewSet, basename="setlog")

session_setlog_list = SetLogViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

urlpatterns = [
    path("sessions/<int:session_pk>/setlogs/", session_setlog_list, name="session-setlog-list"),
    path("", include(router.urls)),
]
