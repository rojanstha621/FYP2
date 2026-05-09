from django.contrib import admin

# Register your models here.
from . import models

admin.site.register(models.MedicalHistory)
admin.site.register(models.TherapistPatientAssignment)
admin.site.register(models.NursePatientAssignment)
admin.site.register(models.Appointment)
