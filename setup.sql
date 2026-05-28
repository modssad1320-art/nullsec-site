CREATE DATABASE IF NOT EXISTS nullsec_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nullsec_db;

CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  last_login TIMESTAMP NULL,
  login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500) DEFAULT NULL,
  old_price DECIMAL(10,2) DEFAULT NULL,
  promo_price DECIMAL(10,2) NOT NULL,
  checkout_link VARCHAR(1000) NOT NULL,
  display_order INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO site_config (config_key, config_value) VALUES
  ('whatsapp_link', 'https://wa.me/5511999999999'),
  ('hero_title', 'Domine o Hacking Ético'),
  ('hero_subtitle', 'Cursos exclusivos para quem leva segurança a sério.');
