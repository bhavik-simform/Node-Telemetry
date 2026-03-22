# Modern Node.js Microservices Project

This is a complete production-grade Node.js microservices project demonstrating communication via RabbitMQ, storage in PostgreSQL, and full observability using OpenTelemetry.

## Architecture

- **User Service**: Exposes user management APIs. Uses PostgreSQL. Publishes `user.created` to RabbitMQ.
- **Order Service**: Exposes order management APIs. Uses PostgreSQL. Publishes `order.created` to RabbitMQ. Consumes `user.created` to keep user replicas locally.
- **Notification Service**: Consumes `order.created` and logs a structured notification.

## Observability Stack

- **OpenTelemetry Collector**: Receives traces, metrics, logs via OTLP and routes them.
- **Prometheus**: Stores metrics.
- **Loki**: Stores logs.
- **Tempo**: Stores traces.
- **Grafana**: Visualizes everything.

## Running the Project

1. Ensure Docker and Docker Compose are installed.
2. Run the full stack:
```bash
docker compose up --build
```
3. Once running, all infrastructure and microservices will be live.

### Testing the Endpoints

1. Create a user:
```bash
curl -X POST http://localhost:3001/users -H "Content-Type: application/json" -d '{"name": "Alice", "email": "alice@example.com"}'
```
2. Fetch the user:
```bash
curl http://localhost:3001/users/1
```
3. Create an order (make sure the user_id matches the created user):
```bash
curl -X POST http://localhost:3002/orders -H "Content-Type: application/json" -d '{"user_id": 1, "product": "Laptop", "amount": 1200}'
```

### Accessing Dashboards

- **Grafana**: http://localhost:3000
    - Go to **Explore** to query Tempo (traces), Loki (logs), and Prometheus (metrics).
    - Find traces by selecting **Tempo** datasource and querying trace ID or searching based on service name.
- **RabbitMQ**: http://localhost:15672 (guest/guest)
- **Prometheus**: http://localhost:9090
