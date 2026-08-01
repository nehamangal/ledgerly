# analyst/services.py
import requests
import os

SPRING_BOOT_API_URL = os.getenv("SPRING_BOOT_API_URL", "http://localhost:8080/api")
def fetch_transactions_from_spring(account_id=None):
    url = f"{SPRING_BOOT_API_URL}/transactions"
    params = {}
    if account_id:
        params['accountId'] = account_id

    try:
        # Ensure this is a GET request matching Spring's @GetMapping("/transactions")
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
    except requests.exceptions.ConnectionError:
        print("Could not connect to Spring Boot backend.")
    return []