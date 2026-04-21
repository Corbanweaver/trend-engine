FROM python:3.12-slim
WORKDIR /app
COPY artifacts/fastapi-server/requirements.txt .
RUN pip install -r requirements.txt
COPY artifacts/fastapi-server/ .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
