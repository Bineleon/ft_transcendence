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
prod:
	$(DC) -f docker-compose.prod.yaml up -d --build


# Stopper tous les conteneurs
stop:
	$(DC) -f docker-compose.dev.yaml down || true
	$(DC) -f docker-compose.prod.yaml down || true

# Nettoyer (dangereux, supprime les volumes aussi)
clean:
	docker system prune -af
	docker volume rm ft_transcendence_db-data || true