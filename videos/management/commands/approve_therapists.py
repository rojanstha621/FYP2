"""
Script to check and fix therapist approval status.
Run this to ensure therapists can access video endpoints.
"""
from django.core.management.base import BaseCommand
from account.models import User


class Command(BaseCommand):
    help = 'Check and approve all therapist users for testing'

    def handle(self, *args, **options):
        therapists = User.objects.filter(role='THERAPIST')
        
        self.stdout.write(f'\nFound {therapists.count()} therapist(s)\n')
        
        for therapist in therapists:
            self.stdout.write(f'\nTherapist: {therapist.email}')
            self.stdout.write(f'  Current status: {therapist.therapist_status}')
            self.stdout.write(f'  Is approved: {therapist.is_approved_therapist}')
            
            # Auto-approve if pending or not set
            if therapist.therapist_status != User.TherapistStatusChoices.APPROVED:
                therapist.therapist_status = User.TherapistStatusChoices.APPROVED
                therapist.is_therapist_approved = True
                therapist.save()
                self.stdout.write(self.style.SUCCESS(f'  ✓ Approved {therapist.email}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Already approved'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ All therapists checked and approved\n'))
