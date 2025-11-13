.PHONY: help .env up down restart logs build prod-build prod-up prod-down prod-logs prod-restart prod-clean

RED=\033[1;31m
GREEN=\033[1;32m
YELLOW=\033[1;33m
BLUE=\033[1;34m
NC=\033[0m
BOLD=\033[1m

.DEFAULT_GOAL := help

help: ## Show this help message
	@printf '%b\n' "${BOLD}${BLUE}Available commands:${NC}"
	@printf '%b\n' ""
	@printf '%b\n' "${BOLD}${YELLOW}Development:${NC}"
	@printf '%b\n' "  ${GREEN}make up${NC}         - Start development stack (docker compose)"
	@printf '%b\n' "  ${GREEN}make down${NC}       - Stop development stack"
	@printf '%b\n' "  ${GREEN}make restart${NC}    - Restart development stack"
	@printf '%b\n' "  ${GREEN}make logs${NC}       - View development logs"
	@printf '%b\n' "  ${GREEN}make build${NC}      - Rebuild development images"
	@printf '%b\n' ""
	@printf '%b\n' "${BOLD}${YELLOW}Production:${NC}"
	@printf '%b\n' "  ${GREEN}make prod-build${NC}   - Build production images"
	@printf '%b\n' "  ${GREEN}make prod-up${NC}      - Start production stack"
	@printf '%b\n' "  ${GREEN}make prod-down${NC}    - Stop production stack"
	@printf '%b\n' "  ${GREEN}make prod-logs${NC}    - View production logs"
	@printf '%b\n' "  ${GREEN}make prod-restart${NC} - Restart production stack"
	@printf '%b\n' "  ${GREEN}make prod-clean${NC}   - Clean production resources (images, volumes)"
	@printf '%b\n' ""

# Портативный inplace-SED: создаём .bak и удаляем после (GNU и BSD sed совместимы с -i.suf)
define SED_INPLACE
sed -i.bak -e "$(1)" "$(2)" && rm -f "$(2).bak"
endef

.env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		printf '%b\n' "${GREEN}Файл .env создан${NC}"; \
		DATABASE_PASSWORD=$$(openssl rand -base64 12); \
		$(call SED_INPLACE,s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$$DATABASE_PASSWORD|,.env); \
		$(call SED_INPLACE,s|^DATABASE_PASSWORD=.*|DATABASE_PASSWORD=$$DATABASE_PASSWORD|,.env); \
		APP_KEYS=$$(for i in 1 2 3 4 5; do openssl rand -hex 12; done | paste -sd ',' -); \
		$(call SED_INPLACE,s|^APP_KEYS=.*|APP_KEYS=$$APP_KEYS|,.env); \
		$(call SED_INPLACE,s|^API_TOKEN_SALT=.*|API_TOKEN_SALT=$$(openssl rand -base64 16 2>/dev/null | tr -d '/+=' | cut -c1-20)|,.env); \
		$(call SED_INPLACE,s|^ADMIN_JWT_SECRET=.*|ADMIN_JWT_SECRET=$$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' | cut -c1-50)|,.env); \
		$(call SED_INPLACE,s|^TRANSFER_TOKEN_SALT=.*|TRANSFER_TOKEN_SALT=$$(openssl rand -base64 16 2>/dev/null | tr -d '/+=' | cut -c1-20)|,.env); \
		$(call SED_INPLACE,s|^JWT_SECRET=.*|JWT_SECRET=$$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' | cut -c1-50)|,.env); \
		$(call SED_INPLACE,s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' | cut -c1-32)|,.env); \
		$(call SED_INPLACE,s|^REVALIDATION_SECRET=.*|REVALIDATION_SECRET=$$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' | cut -c1-50)|,.env); \
		printf '%b\n' "${GREEN}Файл .env настроен${NC}"; \
		echo ""; \
	else \
		printf '%b\n' "${YELLOW}Файл .env уже существует, пропускаем создание${NC}"; \
		echo ""; \
	fi

up: .env
	@docker compose up -d

down:
	@docker compose down

restart: down up

logs:
	@docker compose logs -f

build:
	@docker compose build --no-cache

# Production targets
NETWORK_NAME=strapi-next-prod
POSTGRES_CONTAINER=postgres-prod
BACKEND_CONTAINER=backend-prod
FRONTEND_CONTAINER=frontend-prod
BACKEND_IMAGE=strapi-backend:prod
FRONTEND_IMAGE=nextjs-frontend:prod

prod-build: .env
	@printf '%b\n' "${BLUE}${BOLD}Building production images...${NC}"
	@# Load environment variables
	@if [ ! -f .env ]; then \
		printf '%b\n' "${RED}Error: .env file not found. Run 'make .env' first${NC}"; \
		exit 1; \
	fi
	@# Build backend
	@printf '%b\n' "${YELLOW}Building backend image...${NC}"
	@docker build -t $(BACKEND_IMAGE) ./backend
	@# Build frontend with build args for NEXT_PUBLIC_* variables
	@printf '%b\n' "${YELLOW}Building frontend image...${NC}"
	@. ./.env && docker build \
		--build-arg NEXT_PUBLIC_STRAPI_URL=$$NEXT_PUBLIC_STRAPI_URL \
		--build-arg NEXT_PUBLIC_DEFAULT_LOCALE=$$DEFAULT_LOCALE \
		--build-arg NEXT_PUBLIC_AVAILABLE_LOCALES=$$AVAILABLE_LOCALES \
		-t $(FRONTEND_IMAGE) ./frontend
	@printf '%b\n' "${GREEN}${BOLD}✓ Production images built successfully${NC}"

prod-up: .env
	@printf '%b\n' "${BLUE}${BOLD}Starting production stack...${NC}"
	@# Load environment variables
	@. ./.env && \
	# Create network if not exists \
	docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || docker network create $(NETWORK_NAME) && \
	printf '%b\n' "${YELLOW}Starting PostgreSQL...${NC}" && \
	# Start PostgreSQL \
	docker run --rm -d \
		--name $(POSTGRES_CONTAINER) \
		--network $(NETWORK_NAME) \
		-e POSTGRES_USER=$$POSTGRES_USER \
		-e POSTGRES_PASSWORD=$$POSTGRES_PASSWORD \
		-e POSTGRES_DB=$$POSTGRES_DB \
		-v postgres_prod_data:/var/lib/postgresql/data \
		postgres:18-alpine && \
	printf '%b\n' "${YELLOW}Waiting for PostgreSQL to be ready...${NC}" && \
	sleep 5 && \
	printf '%b\n' "${YELLOW}Starting backend (Strapi)...${NC}" && \
	# Start backend \
	docker run --rm -d \
		--name $(BACKEND_CONTAINER) \
		--network $(NETWORK_NAME) \
		-p 1337:1337 \
		-e NODE_ENV=production \
		-e DATABASE_CLIENT=$$DATABASE_CLIENT \
		-e DATABASE_HOST=$(POSTGRES_CONTAINER) \
		-e DATABASE_PORT=$$DATABASE_PORT \
		-e DATABASE_NAME=$$DATABASE_NAME \
		-e DATABASE_USERNAME=$$DATABASE_USERNAME \
		-e DATABASE_PASSWORD=$$DATABASE_PASSWORD \
		-e DATABASE_SSL=$$DATABASE_SSL \
		-e APP_KEYS="$$APP_KEYS" \
		-e API_TOKEN_SALT=$$API_TOKEN_SALT \
		-e ADMIN_JWT_SECRET=$$ADMIN_JWT_SECRET \
		-e TRANSFER_TOKEN_SALT=$$TRANSFER_TOKEN_SALT \
		-e JWT_SECRET=$$JWT_SECRET \
		-e ENCRYPTION_KEY=$$ENCRYPTION_KEY \
		-e HOST=$$HOST \
		-e PORT=$$PORT \
		-e NEXTJS_URL=http://$(FRONTEND_CONTAINER):3000 \
		-e REVALIDATION_SECRET=$$REVALIDATION_SECRET \
		-e ENABLE_WEBHOOKS=$$ENABLE_WEBHOOKS \
		-e DEFAULT_LOCALE=$$DEFAULT_LOCALE \
		-e AVAILABLE_LOCALES=$$AVAILABLE_LOCALES \
		$(BACKEND_IMAGE) && \
	printf '%b\n' "${YELLOW}Waiting for backend to be ready...${NC}" && \
	sleep 8 && \
	printf '%b\n' "${YELLOW}Starting frontend (Next.js)...${NC}" && \
	# Start frontend \
	docker run --rm -d \
		--name $(FRONTEND_CONTAINER) \
		--network $(NETWORK_NAME) \
		-p 3000:3000 \
		-e NODE_ENV=production \
		-e NEXT_PUBLIC_STRAPI_URL=$$NEXT_PUBLIC_STRAPI_URL \
		-e STRAPI_URL=http://$(BACKEND_CONTAINER):1337 \
		-e REVALIDATION_SECRET=$$REVALIDATION_SECRET \
		-e NEXT_PUBLIC_DEFAULT_LOCALE=$$DEFAULT_LOCALE \
		-e NEXT_PUBLIC_AVAILABLE_LOCALES=$$AVAILABLE_LOCALES \
		$(FRONTEND_IMAGE) && \
	printf '%b\n' "${GREEN}${BOLD}✓ Production stack started successfully${NC}" && \
	printf '%b\n' "${GREEN}Frontend: http://localhost:3000${NC}" && \
	printf '%b\n' "${GREEN}Backend: http://localhost:1337${NC}"

prod-down:
	@printf '%b\n' "${BLUE}${BOLD}Stopping production stack...${NC}"
	@docker stop $(FRONTEND_CONTAINER) $(BACKEND_CONTAINER) $(POSTGRES_CONTAINER) 2>/dev/null || true
	@docker network rm $(NETWORK_NAME) 2>/dev/null || true
	@printf '%b\n' "${GREEN}${BOLD}✓ Production stack stopped${NC}"

prod-logs:
	@printf '%b\n' "${BLUE}${BOLD}Production logs (Ctrl+C to exit):${NC}"
	@docker logs -f $(BACKEND_CONTAINER) 2>&1 &
	@docker logs -f $(FRONTEND_CONTAINER)

prod-restart: prod-down prod-up

prod-clean: prod-down
	@printf '%b\n' "${BLUE}${BOLD}Cleaning production resources...${NC}"
	@docker rmi $(BACKEND_IMAGE) $(FRONTEND_IMAGE) 2>/dev/null || true
	@docker volume rm postgres_prod_data 2>/dev/null || true
	@printf '%b\n' "${GREEN}${BOLD}✓ Production resources cleaned${NC}"
