from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import mysql.connector


app = Flask(__name__)
CORS(app)  # React (localhost:3000) からのアクセスを許可

@app.route("/api/words", methods=["GET"])
def get_words():
    category = request.args.get("category")
    dataset = request.args.get("dataset")

    if not category or not dataset:
        return jsonify({"error": "Missing category or dataset"}), 400

    try:
        connection = mysql.connector.connect(
            host=os.environ.get("DB_HOST"),
            port=os.environ.get("DB_PORT"),
            user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASSWORD"),
            database=os.environ.get("DB_NAME")
        )
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT word, answer, sentence, sentence_jp
            FROM WORD
            WHERE category = %s AND dataset = %s
        """
        cursor.execute(query, (category, dataset))
        rows = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(rows)

    except Exception as e:
        print("DB接続エラー:", e)
        return jsonify({"error": "DB接続エラー"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0",port = 5050)
