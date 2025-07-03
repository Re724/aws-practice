CREATE DATABASE IF NOT EXISTS wordapp;
USE wordapp;

CREATE TABLE IF NOT EXISTS WORD(
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50),
    dataset VARCHAR(50),
    word VARCHAR(100),
    answer VARCHAR(100),
    sentence TEXT,
    sentence_jp TEXT
);
