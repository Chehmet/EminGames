# screen_timer/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('timerEmin.urls')),  # <-- Эта строка самая важная
]