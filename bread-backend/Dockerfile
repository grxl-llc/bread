FROM python:3.11-slim

# Don't write .pyc files; flush stdout/stderr immediately (better logs)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app
COPY . .

# Most hosts inject a $PORT env var; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000

# Shell form so $PORT expands at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
