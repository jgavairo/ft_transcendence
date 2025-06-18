#!/bin/bash
set -e
CERT_DIR="./docker/nginx/ssl"
KEY_FILE="$CERT_DIR/privkey.pem"
CERT_FILE="$CERT_DIR/fullchain.pem"

mkdir -p "$CERT_DIR"

if [ ! -f "$KEY_FILE" ] || [ ! -f "$CERT_FILE" ]; then
  echo "[INFO] Génération des certificats SSL auto-signés..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=localhost"
  echo "[INFO] Certificats générés dans $CERT_DIR."
else
  echo "[INFO] Certificats SSL déjà présents, aucune action."
fi
