CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  old_price DECIMAL(10,2),
  promo_price DECIMAL(10,2) NOT NULL,
  checkout_link VARCHAR(1000) NOT NULL,
  display_order INTEGER DEFAULT 0,
  active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO site_config (config_key, config_value) VALUES
  ('whatsapp_link', 'https://wa.me/5511999999999'),
  ('hero_title', 'Domine o Hacking Ético'),
  ('hero_subtitle', 'Cursos exclusivos para quem leva segurança a sério.')
ON CONFLICT (config_key) DO NOTHING;
