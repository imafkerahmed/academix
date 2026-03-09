# Build stage
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git gcc musl-dev

WORKDIR /src
RUN git clone https://github.com/jech/galene.git .
RUN go build -ldflags="-s -w"

# Final stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /galene
COPY --from=builder /src/galene /galene/galene
COPY --from=builder /src/static /galene/static

# Directories for persistent data
RUN mkdir -p /groups /data /recordings

EXPOSE 8443

# env GALENE_INSECURE=1 for local dev (HTTP on 8443)
CMD ["/galene/galene", "-http", ":8443", "-insecure", "-groups", "/galene/groups", "-data", "/galene/data", "-udp-range", "10000-10020"]
