# backend/import_json_to_db.py
import os
import json
import mysql.connector

# DB接続情報（docker-compose.ymlと一致させる）
db_config = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", "password"),
    "database": os.environ.get("DB_NAME", "wordapp"),
    "port": int(os.environ.get("DB_PORT", 3306))
}

# JSONファイルが入っているディレクトリ
DATA_DIR = "data"

def insert_word(cursor, category, dataset, word):
    sql = """
    INSERT INTO WORD (category, dataset, word, answer, sentence, sentence_jp)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        category,
        dataset,
        word.get("word"),
        word.get("answer"),
        word.get("sentence"),
        word.get("sentence_jp"),
    ))

def main():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    for category in os.listdir(DATA_DIR):
        cat_path = os.path.join(DATA_DIR, category)
        if not os.path.isdir(cat_path):
            continue

        for filename in os.listdir(cat_path):
            if not filename.endswith(".json"):
                continue

            dataset = filename[:-5]  # "data1.json" → "data1"
            file_path = os.path.join(cat_path, filename)

            with open(file_path, "r", encoding="utf-8") as f:
                words = json.load(f)
                for word in words:
                    insert_word(cursor, category, dataset, word)

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ データベースへのインポートが完了しました。")

if __name__ == "__main__":
    main()
