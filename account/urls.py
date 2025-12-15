# urls.py
from django.urls import path
from .views import RegisterView, LoginView, UserListCreateView, UserRetrieveUpdateDestroyView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<uuid:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
]
