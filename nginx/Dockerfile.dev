# nginx/Dockerfile

FROM nginx:alpine

# # Supprimer la config default si présente
# RUN rm /etc/nginx/conf.d/default.conf || true

# Copier les certificats dans l’image
COPY certs /etc/nginx/certs

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
