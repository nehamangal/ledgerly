from django.urls import path
from .views import Insightview
from .views import *

urlpatterns = [
    path("insight/", Insightview.as_view() , name='insight'),
    path('stream/<str:account_id>/', transaction_sse_stream, name='sse-stream'),
]