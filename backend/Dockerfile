FROM python:3.11-slim

RUN apt-get update && apt-get install -y build-essential git wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend /app

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]