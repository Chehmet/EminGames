# timerEmin/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Главная страница
    path('', views.main_page, name='main_page'),
    
    # --- Новые API эндпоинты ---
    path('api/kidstatus/<str:kid_name>/', views.get_kid_status, name='get_kid_status'),
    path('api/add-time/<str:kid_name>/', views.add_time, name='add_time'),
    path('api/log-time/<str:kid_name>/', views.log_time, name='log_time'),
]