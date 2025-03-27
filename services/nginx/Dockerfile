FROM nginx:alpine

# Copier uniquement la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Créer le dossier pour les fichiers statiques
RUN mkdir -p /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"] 