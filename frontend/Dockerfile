# frontend/Dockerfile
FROM nginx:alpine

# Optionnel : copier une configuration nginx personnalisée
# COPY nginx.conf /etc/nginx/nginx.conf

# Copier le contenu du dossier src dans le répertoire statique de nginx
COPY src/ /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
