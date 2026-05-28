#!/usr/bin/env bash
set -e

echo "=== NULL SEC — Setup & Start ==="

# Start MariaDB if not running
if ! mysqladmin ping -u root 2>/dev/null; then
  echo "[*] Iniciando MariaDB..."
  sudo systemctl start mariadb || sudo service mariadb start
  sleep 2
fi

echo "[*] Configurando banco de dados..."
node utils/setupDb.js

echo "[*] Iniciando servidor..."
node server.js
