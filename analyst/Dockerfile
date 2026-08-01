FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# Default command can be overridden in compose for the consumer worker
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]