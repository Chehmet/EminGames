# timerEmin/views.py

from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
import json

# Наша простая "in-memory" база данных.
# В реальном проекте это были бы модели Django и база данных (SQLite, PostgreSQL).
# TOTAL_MINUTES - сколько всего минут в день. REMAINING_MINUTES - сколько осталось.
KID_DATA = {
    'emin': {'total_minutes': 60, 'remaining_minutes': 60},
    'samira': {'total_minutes': 45, 'remaining_minutes': 45},
}
PARENT_PASSWORD = "1994"

@csrf_exempt # Отключаем CSRF для простоты, т.к. у нас нет системы логина
def get_kid_status(request, kid_name):
    """Возвращает статус времени для конкретного ребенка."""
    kid_name = kid_name.lower()
    if kid_name not in KID_DATA:
        return JsonResponse({'error': 'Kid not found'}, status=404)
    
    data = KID_DATA[kid_name]
    # Отдаем данные в том же формате (часы), чтобы не менять фронтенд-логику конвертации
    remaining_hours = data['remaining_minutes'] / 60.0
    
    return JsonResponse({
        'kid_name': kid_name,
        'total_minutes': data['total_minutes'],
        'remaining_minutes': data['remaining_minutes'],
        'allowed_tv_hours': round(remaining_hours, 2) # Округляем до 2 знаков
    })

@csrf_exempt
def add_time(request, kid_name):
    """Добавляет 10 минут за книгу после проверки пароля."""
    if request.method != 'POST':
        return HttpResponseBadRequest("Only POST method is allowed")

    kid_name = kid_name.lower()
    if kid_name not in KID_DATA:
        return JsonResponse({'error': 'Kid not found'}, status=404)

    try:
        body = json.loads(request.body)
        password = body.get('password')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    if password != PARENT_PASSWORD:
        return JsonResponse({'error': 'Incorrect password'}, status=403) # 403 Forbidden

    # Добавляем 10 минут
    KID_DATA[kid_name]['remaining_minutes'] += 10
    
    return JsonResponse({'success': True, 'new_minutes': KID_DATA[kid_name]['remaining_minutes']})

@csrf_exempt
def log_time(request, kid_name):
    """Списывает просмотренное время."""
    if request.method != 'POST':
        return HttpResponseBadRequest("Only POST method is allowed")

    kid_name = kid_name.lower()
    if kid_name not in KID_DATA:
        return JsonResponse({'error': 'Kid not found'}, status=404)
        
    try:
        body = json.loads(request.body)
        minutes_watched = int(body.get('minutes', 0))
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Invalid data'}, status=400)

    # Уменьшаем время, но не уходим в минус
    current_minutes = KID_DATA[kid_name]['remaining_minutes']
    KID_DATA[kid_name]['remaining_minutes'] = max(0, current_minutes - minutes_watched)
    
    return JsonResponse({'success': True, 'new_minutes': KID_DATA[kid_name]['remaining_minutes']})

# Главная страница (остается без изменений)
from django.shortcuts import render
def main_page(request):
    return render(request, 'timerEmin/index.html')