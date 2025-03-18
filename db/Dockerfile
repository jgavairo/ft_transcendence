# db/Dockerfile
FROM alpine:3.18

RUN apk add --no-cache sqlite

WORKDIR /db

COPY init-db.sql .

CMD ["sqlite3", "/db/mydatabase.db"]
