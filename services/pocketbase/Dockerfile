FROM alpine:latest

# Install wget and unzip
RUN apk add --no-cache wget unzip


# Set PocketBase version
ENV PB_VERSION=0.36.1

# Download and extract PocketBase
RUN wget -O /tmp/pb.zip https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip /tmp/pb.zip -d /pb \
    && rm /tmp/pb.zip

WORKDIR /pb

# Expose default PocketBase port
EXPOSE 8090

# Run PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]