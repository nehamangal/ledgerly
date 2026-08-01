import json
import pika
from django.core.management.base import BaseCommand
import os

class Command(BaseCommand):
  help = "Start RabbitMQ consumer for transactions"

  def handle(self, *args, **options):
    rabbit_host = os.getenv("RABBITMQ_HOST", "localhost")
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=rabbit_host,
            credentials=pika.PlainCredentials("guest", "guest"),
        )
    )
    channel = connection.channel()

    channel.exchange_declare(
        exchange="transaction.exchange", exchange_type="direct"
    )
    result = channel.queue_declare(queue="django_transaction_queue", durable=True)
    queue_name = result.method.queue

    channel.queue_bind(
        exchange="transaction.exchange",
        queue=queue_name,
        routing_key="transaction.created",
    )

    def callback(ch, method, properties, body):
      data = json.loads(body)
      self.stdout.write(
          self.style.SUCCESS(
              f"Received transaction for user: {data.get('userId')}"
          )
      )

      # TODO: Trigger your Django prediction logic here using `data`

      ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=queue_name, on_message_callback=callback)
    self.stdout.write("Waiting for transaction events...")
    channel.start_consuming()