# timerEmin/views.py

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import requests # <-- Импортируем новую библиотеку
import json

# --- УДАЛЯЕМ СЛОВАРЬ KID_DATA ---
# Теперь данные хранятся на вашем реальном бэкенде

# Адрес вашего настоящего бэкенда
REAL_BACKEND_URL = "https://backend.gcrm.online/api/v1/finance"

@csrf_exempt
def get_kid_status(request, kid_name):
    """
    Прокси-функция: получает запрос от фронтенда,
    перенаправляет его на реальный бэкенд и возвращает ответ.
    """
    try:
        # Делаем запрос на реальный бэкенд
        response = requests.get(f"{REAL_BACKEND_URL}/kidstatus/{kid_name}/")
        # Проверяем, успешен ли запрос
        response.raise_for_status() 
        # Возвращаем JSON-ответ от бэкенда как есть
        return JsonResponse(response.json())
    except requests.exceptions.RequestException as e:
        # Если бэкенд недоступен или вернул ошибку, сообщаем об этом
        return JsonResponse({'error': f'Could not connect to the backend: {e}'}, status=502) # 502 Bad Gateway

@csrf_exempt
def add_time(request, kid_name):
    """Прокси-функция для добавления времени."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        # Получаем данные (пароль) из тела запроса от фронтенда
        body = json.loads(request.body)
        
        # Пересылаем эти данные на реальный бэкенд
        response = requests.post(f"{REAL_BACKEND_URL}/add-time/{kid_name}/", json=body)
        response.raise_for_status()
        
        return JsonResponse(response.json(), status=response.status_code)
    except requests.exceptions.RequestException as e:
        # Если пароль неверный, реальный бэкенд вернет ошибку (например, 403),
        # и мы ее просто перешлем. Этот блок для случаев, когда сервер недоступен.
        return JsonResponse({'error': f'Could not connect to the backend: {e}'}, status=502)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON in request'}, status=400)


@csrf_exempt
def log_time(request, kid_name):
    """Прокси-функция для списания времени."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        body = json.loads(request.body)
        
        response = requests.post(f"{REAL_BACKEND_URL}/log-time/{kid_name}/", json=body)
        response.raise_for_status()

        return JsonResponse(response.json(), status=response.status_code)
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': f'Could not connect to the backend: {e}'}, status=502)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON in request'}, status=400)


# --- Эта функция остается БЕЗ ИЗМЕНЕНИЙ ---
from django.shortcuts import render
def main_page(request):
    return render(request, 'timerEmin/index.html')