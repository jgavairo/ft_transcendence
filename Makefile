.PHONY: up stop down clean

all: up

up:
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
