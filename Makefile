# Makefile pour Transcendance

# Variables
DC=docker compose
APP_NAME=transcendance

# Lancer le projet en mode développement
# --build : Reconstruit l'image si modifiée
dev:
	$(DC) -f docker-compose.dev.yaml up --build


# Lancer le projet en mode prod
# -d : En background pour avoir la main sur le terminal
docker-prod:
	$(DC) -f docker-compose.prod.yaml up -d --build


# Stopper tous les conteneurs
stop:
	$(DC) -f docker-compose.dev.yaml down || true
	$(DC) -f docker-compose.prod.yaml down || true

# Nettoyer (dangereux, supprime les volumes aussi)
clean:
	docker system prune -af
	docker volume rm ft_transcendence_db-data || true
	docker volume rm ft_transcendence_avatars-data || true
	docker volume rm ft_transcendence_avatars|| true
	docker system prune -a --volumes

install-backend:
	cd backend && npm install

install-frontend:
	cd frontend && npm install

prod: install-backend install-frontend docker-prod

# Voir les logs en prod
logs-prod:
	$(DC) -f docker-compose.prod.yaml logs -f

# Voir les logs backend en prod
logs-backend:
	$(DC) -f docker-compose.prod.yaml logs -f backend

# Voir les logs frontend en prod
logs-frontend:
	$(DC) -f docker-compose.prod.yaml logs -f frontend

# Voir les logs en dev
logs-dev:
	$(DC) -f docker-compose.dev.yaml logs -f