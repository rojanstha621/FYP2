from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile

from . import models


@admin.register(User)
class CustomUserAdmin(UserAdmin):
	model = User
	list_display = ("email", "first_name", "last_name", "role", "therapist_status", "is_therapist_approved", "therapist_verified_at", "is_active")
	list_filter = ("role", "therapist_status", "is_therapist_approved", "is_active")
	search_fields = ("email", "first_name", "last_name")
	ordering = ("-created_at",)
	fieldsets = (
		(None, {"fields": ("email", "password")}),
		("Personal info", {"fields": ("first_name", "last_name", "phone_number")}),
		(
			"Permissions",
			{
				"fields": (
					"is_active",
					"is_staff",
					"is_superuser",
					"groups",
					"user_permissions",
				)
			},
		),
		(
			"Role & Therapist Approval",
			{
				"fields": (
					"role",
					"therapist_status",
					"is_therapist_approved",
					"therapist_verified_at",
				)
			},
		),
		("Important dates", {"fields": ("last_login", "date_joined")}),
	)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("user", "address", "created_at", "updated_at")
