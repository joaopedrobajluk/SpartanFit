-- SpartanFit | rode no phpMyAdmin (aba SQL)
CREATE DATABASE IF NOT EXISTS spartanfit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spartanfit;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profiles (
  user_id    INT UNSIGNED PRIMARY KEY,
  peso       VARCHAR(10)  NULL,
  altura     VARCHAR(10)  NULL,
  nivel      VARCHAR(20)  NOT NULL DEFAULT 'Intermediário',
  sleep_goal DECIMAL(3,1) NOT NULL DEFAULT 8.0,
  quiz_json  LONGTEXT     NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Reservada para salvar treinos, metas, água e sono (próxima etapa)
CREATE TABLE IF NOT EXISTS app_state (
  user_id    INT UNSIGNED PRIMARY KEY,
  data       LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
