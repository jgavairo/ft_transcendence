.PHONY: up stop down clean certs

all: up

up:
	bash scripts/generate-certs.sh && docker compose up --build -d

stop:
	docker compose stop

down:
	docker compose down

restart:
	rm -rf ./docker/nginx/ssl/fullchain.pem
	rm -rf ./docker/nginx/ssl/privkey.pem
	bash scripts/generate-certs.sh
	docker compose down
	docker compose up --build -d

clean:
	docker compose down -v
	rm -rf ./docker/nginx/ssl/fullchain.pem
	rm -rf ./docker/nginx/ssl/privkey.pem
