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

def create_table_if_not_exists(cursor):
    """テーブルが存在しない場合は作成"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS WORD (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        dataset VARCHAR(50) NOT NULL,
        type VARCHAR(50) DEFAULT 'word',
        word TEXT NOT NULL,
        answer TEXT NOT NULL,
        sentence TEXT,
        sentence_jp TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    """
    cursor.execute(create_table_sql)
    print("✅ テーブルの確認/作成が完了しました。")

def check_and_add_columns(cursor):
    """既存のテーブルに必要なカラムがなければ追加"""
    try:
        cursor.execute("DESCRIBE WORD")
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        if 'type' not in existing_columns:
            cursor.execute("ALTER TABLE WORD ADD COLUMN type VARCHAR(50) DEFAULT 'word'")
            print("✅ 'type' カラムを追加しました。")
        
        if 'notes' not in existing_columns:
            cursor.execute("ALTER TABLE WORD ADD COLUMN notes TEXT")
            print("✅ 'notes' カラムを追加しました。")
    except mysql.connector.Error as e:
        print(f"⚠️ カラム追加時にエラーが発生しました: {e}")

def insert_word(cursor, category, dataset, word):
    """単語データをデータベースに挿入（重複チェック付き）"""
    check_sql = """
        SELECT 1 FROM WORD
        WHERE category = %s AND dataset = %s AND word = %s AND answer = %s
    """
    cursor.execute(check_sql, (
        category,
        dataset,
        word.get("word"),
        word.get("answer"),
    ))

    if cursor.fetchone():
        return  # 重複しているのでスキップ

    insert_sql = """
    INSERT INTO WORD (category, dataset, type, word, answer, sentence, sentence_jp, notes)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(insert_sql, (
        category,
        dataset,
        word.get("type", "word"),
        word.get("word"),
        word.get("answer"),
        word.get("sentence"),
        word.get("sentence_jp"),
        word.get("notes"),
    ))

def validate_word_data(word, file_path):
    """単語データの妥当性をチェック"""
    required_fields = ["word", "answer"]
    missing_fields = [field for field in required_fields if not word.get(field)]
    
    if missing_fields:
        print(f"⚠️ 必須フィールドが不足しています ({file_path}): {missing_fields}")
        print(f"   データ: {word}")
        return False
    return True

def main():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        create_table_if_not_exists(cursor)
        check_and_add_columns(cursor)

        total_imported = 0
        total_skipped = 0

        print(f"📁 データディレクトリ: {DATA_DIR}")
        
        for category in os.listdir(DATA_DIR):
            cat_path = os.path.join(DATA_DIR, category)
            if not os.path.isdir(cat_path):
                continue

            print(f"\n📂 カテゴリ: {category}")
            
            for filename in os.listdir(cat_path):
                if not filename.endswith(".json"):
                    continue

                dataset = filename[:-5]
                file_path = os.path.join(cat_path, filename)
                print(f"  📄 処理中: {filename}")

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        words = json.load(f)
                        if isinstance(words, dict):
                            words = [words]
                        
                        file_imported = 0
                        file_skipped = 0

                        for word in words:
                            if validate_word_data(word, file_path):
                                insert_word(cursor, category, dataset, word)
                                file_imported += 1
                            else:
                                file_skipped += 1

                        total_imported += file_imported
                        total_skipped += file_skipped

                        print(f"    ✅ インポート: {file_imported}件, スキップ: {file_skipped}件")

                except json.JSONDecodeError as e:
                    print(f"    ❌ JSONパースエラー: {e}")
                except Exception as e:
                    print(f"    ❌ ファイル処理エラー: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()

        print(f"\n🎉 データベースへのインポートが完了しました。")
        print(f"📊 統計:")
        print(f"   - 総インポート数: {total_imported}件")
        print(f"   - 総スキップ数: {total_skipped}件")

    except mysql.connector.Error as e:
        print(f"❌ データベース接続エラー: {e}")
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")

if __name__ == "__main__":
    main()
