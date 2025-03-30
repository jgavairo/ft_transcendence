.PHONY: up stop down clean

all: up

up:
	docker compose up --build -d

stop:
	docker compose stop

down:
	docker compose down

clean:
	docker compose down -v
