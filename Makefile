.PHONY: up stop down clean certs

all: up

certs:
	bash scripts/generate-certs.sh

up: certs
	docker compose up --build -d

stop:
	docker compose stop

down:
	docker compose down

restart:
	docker compose down
	docker compose up --build -d

clean:
	docker compose down -v
