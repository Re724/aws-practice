# backend/Dockerfile

FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5050

CMD sh -c "sleep 10 && python import_json_to_db.py && python app.py"

