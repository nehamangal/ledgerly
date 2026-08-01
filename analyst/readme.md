# Django Analytics & Real-Time Worker Service (`analyst`)

This component of the **ledgerly-app** is built with **Django** and **Django REST Framework (DRF)**. It acts as the intelligent background worker and real-time streaming layer, processing transaction events consumed from **RabbitMQ** and pushing AI insights (subscriptions and spending anomalies) directly to the Next.js frontend via **Server-Sent Events (SSE)**.

---

## Key Features

* **Event-Driven Processing:** Integrates with RabbitMQ via a custom management command to process asynchronous transaction events.
* **Predictive Analytics:** 
  * **Subscription Detection:** Automatically groups recurring merchant transactions spaced ~30 days apart.
  * **Anomaly Detection:** Flags sudden spending spikes exceeding 2x category averages.
* **Real-Time SSE Streaming:** Maintains a persistent HTTP thread-safe queue connection to stream live analytical updates down to the frontend dashboard.
* **REST API Endpoints:** Provides initial fallback data fetching for account insights.

---

## Project Structure

```text
analyst/
├── analyst/
│   ├── management/
│   │   └── commands/
│   │       └── consume_transactions.py  # RabbitMQ background worker command
│   ├── logic.py                         # Subscription & anomaly detection algorithms
│   ├── service.py                       # Spring Boot API integration helpers
│   ├── views.py                         # REST views & SSE StreamingResponse generator
│   └── urls.py                          # App-level URL routing
├── config/                                # Django project settings & main URLs
├── Dockerfile
├── requirements.txt
└── manage.py