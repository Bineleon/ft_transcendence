# Makefile pour Transcendance

# Variables
DOCKER_COMPOSE=docker compose
APP_NAME=transcendance

# Lancer le projet en mode développement
up:
	$(DOCKER_COMPOSE) up -d --build

# Arrêter les containers sans supprimer les volumes
down:
	$(DOCKER_COMPOSE) down

# Arrêter les containers et supprimer les volumes persistants
down-clean:
	$(DOCKER_COMPOSE) down -v

# Voir les logs en temps réel
logs:
	$(DOCKER_COMPOSE) logs -f

# Ouvrir un shell dans le backend
shell-backend:
	$(DOCKER_COMPOSE) exec backend sh

# Ouvrir un shell dans le frontend
shell-frontend:
	$(DOCKER_COMPOSE) exec frontend sh

# Réinitialiser complètement la DB (attention : supprime les données)
reset-db:
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d --build

# Construire uniquement les images
build:
	$(DOCKER_COMPOSE) build
