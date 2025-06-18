FROM nginx:alpine

# Copier uniquement la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Créer le dossier pour les fichiers statiques
RUN mkdir -p /usr/share/nginx/html

# Exposer le port 8443
EXPOSE 8443

# Suppression de la génération automatique de certificats ici
# Les certificats doivent être générés sur l'hôte et montés dans le conteneur

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]