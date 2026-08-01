import json
import queue
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse, StreamingHttpResponse
from .service import fetch_transactions_from_spring
from .logic import detect_anomalies, detect_subscriptions

# Global thread-safe event queues dictionary for SSE streaming per account
account_event_queues = {}
class Insightview(APIView):
    def get(self, request):
        account_id = request.GET.get('accountId')        
        # Pull initial transaction list from Spring Boot
        transactions = fetch_transactions_from_spring(account_id)
        # Run analysis logic
        subscriptions = detect_subscriptions(transactions)
        anomalies = detect_anomalies(transactions) # Fixed: called detect_anomalies instead of subscriptions twice

        # Return combined response
        return Response({
            "status": "success",
            "subscriptions": subscriptions,
            "anomalies": anomalies
        }) 

def transaction_sse_stream(request, account_id):
    """SSE endpoint maintaining a continuous connection to push real-time updates"""
    if account_id not in account_event_queues:
        account_event_queues[account_id] = queue.Queue()

    def event_stream():
        q = account_event_queues[account_id]
        yield f"data: {json.dumps({'type': 'CONNECTED', 'message': 'SSE Stream Established'})}\n\n"
        
        while True:
            try:
                # Wait for data pushed by RabbitMQ consumer worker (times out every 15s for heartbeat)
                data = q.get(timeout=15)
                
                # If data is a raw transaction or list, run detection logic or send directly if already processed
                # Assuming `data` coming from RabbitMQ queue contains transactions or pre-calculated payload:
                subscriptions = detect_subscriptions(data) if isinstance(data, list) else data.get('subscriptions', [])
                anomalies = detect_anomalies(data) if isinstance(data, list) else data.get('anomalies', [])
        
                payload = {
                    "type": "NEW_INSIGHTS",
                    "subscriptions": subscriptions,
                    "anomalies": anomalies
                }
                
                # Yield the properly formatted SSE data string
                yield f"data: {json.dumps(payload)}\n\n"
            except queue.Empty:
                # Send a heartbeat comment to keep connection alive
                yield ": heartbeat\n\n"

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no' # Prevents Nginx/Docker from buffering stream output
    return response