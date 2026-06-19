FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Vectors live in Neon Postgres (pgvector) via DATABASE_URL — no local state.
EXPOSE 8000

# $PORT is provided by most platforms (Railway/Render); default 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
