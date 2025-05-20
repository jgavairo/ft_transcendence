FROM nginx:alpine

# Copier uniquement la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Créer le dossier pour les fichiers statiques
RUN mkdir -p /usr/share/nginx/html

# Exposer les ports 80 et 443
EXPOSE 80 8443

# Générer un certificat auto-signé si absent
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    if [ ! -f /etc/nginx/ssl/fullchain.pem ] || [ ! -f /etc/nginx/ssl/privkey.pem ]; then \
      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/CN=localhost"; \
    fi

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]