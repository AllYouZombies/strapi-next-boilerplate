.PHONY: .env up down restart logs build

RED=\033[1;31m
GREEN=\033[1;32m
YELLOW=\033[1;33m
BLUE=\033[1;34m
NC=\033[0m
BOLD=\033[1m

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
