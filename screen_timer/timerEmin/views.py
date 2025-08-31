# timer/views.py

from django.shortcuts import render

def main_page(request):
    """
    Эта функция рендерит основную HTML-страницу.
    """
    return render(request, 'timer/index.html')