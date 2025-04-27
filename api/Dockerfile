FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies and psycopg2 dependencies
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt
RUN pip install gunicorn

# Copy project files
COPY . .

# Run the app
CMD ["gunicorn", "-b", "0.0.0.0:5050", "app:app", "--workers=4", "--threads=2"]
