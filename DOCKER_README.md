# Docker Setup for Juice Jockey

This document provides instructions for containerizing and running the Juice Jockey application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Environment Setup

First, copy the environment template and configure it:

```bash
cp docker.env .env.docker
```

Edit `.env.docker` with your actual Supabase credentials and configuration.

### 2. Development Mode

Run the application in development mode with hot reloading:

```bash
# Using docker-compose with dev profile
docker-compose --profile dev up --build

# Or using docker directly
docker build --target development -t juice-jockey-dev .
docker run -p 8080:8080 -v $(pwd):/app -v /app/node_modules juice-jockey-dev
```

The application will be available at `http://localhost:8080`

### 3. Production Mode

Run the application in production mode:

```bash
# Using docker-compose with prod profile
docker-compose --profile prod up --build

# Or using docker directly
docker build --target production -t juice-jockey-prod .
docker run -p 3000:3000 juice-jockey-prod
```

The application will be available at `http://localhost:3000`

### 4. Production Mode on Port 80

Run the application on the default HTTP port:

```bash
# Using docker-compose with prod-80 profile
docker-compose --profile prod-80 up --build
```

The application will be available at `http://localhost`

## Docker Commands Reference

### Building Images

```bash
# Build development image
docker build --target development -t juice-jockey-dev .

# Build production image
docker build --target production -t juice-jockey-prod .

# Build all stages
docker build -t juice-jockey .
```

### Running Containers

```bash
# Development with volume mounting
docker run -p 8080:8080 -v $(pwd):/app -v /app/node_modules juice-jockey-dev

# Production
docker run -p 3000:3000 juice-jockey-prod

# Production with environment file
docker run -p 3000:3000 --env-file docker.env juice-jockey-prod
```

### Docker Compose Commands

```bash
# Development
docker-compose --profile dev up --build
docker-compose --profile dev down

# Production
docker-compose --profile prod up --build
docker-compose --profile prod down

# Production on port 80
docker-compose --profile prod-80 up --build
docker-compose --profile prod-80 down

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Configuration

### Environment Variables

The following environment variables can be configured in `docker.env`:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_APP_NAME`: Application name (default: "Juice Jockey")
- `VITE_APP_VERSION`: Application version
- `VITE_ENABLE_DEBUG`: Enable debug mode (default: false)
- `VITE_ENABLE_CONSOLE_LOGS`: Enable console logs (default: false)

### Nginx Configuration

The production build uses Nginx for serving static files with the following features:

- Gzip compression
- Security headers
- Client-side routing support (React Router)
- Static asset caching
- Health check endpoint at `/health`

## Multi-Stage Build

The Dockerfile uses a multi-stage build approach:

1. **Builder Stage**: Installs dependencies and builds the React application
2. **Production Stage**: Uses Nginx to serve the built application
3. **Development Stage**: Runs the Vite development server

## Security Features

- Non-root user execution
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Content Security Policy
- Hidden file access denial
- Health check endpoint

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port mapping in docker-compose.yml
2. **Environment variables not loading**: Ensure `docker.env` file exists and is properly formatted
3. **Build failures**: Check that all dependencies are properly installed

### Debugging

```bash
# View container logs
docker logs <container_id>

# Execute commands in running container
docker exec -it <container_id> sh

# Check container status
docker ps -a

# Remove all containers and images
docker system prune -a
```

### Health Check

The production container includes a health check endpoint:

```bash
curl http://localhost:3000/health
```

## Deployment

### Local Development

Use the development profile for local development with hot reloading:

```bash
docker-compose --profile dev up --build
```

### Production Deployment

For production deployment, use the production profile:

```bash
docker-compose --profile prod up --build -d
```

The `-d` flag runs the container in detached mode.

### Docker Hub Deployment

To deploy to Docker Hub:

```bash
# Tag the image
docker tag juice-jockey-prod your-username/juice-jockey:latest

# Push to Docker Hub
docker push your-username/juice-jockey:latest
```

## Performance Optimization

- The production build uses Terser for minification
- Static assets are cached for 1 year
- Gzip compression is enabled
- Vendor chunks are separated for better caching
- Source maps are disabled in production

## Monitoring

The container includes:

- Health check endpoint at `/health`
- Nginx access and error logs
- Container restart policy (`unless-stopped`)

For production monitoring, consider integrating with:

- Docker health checks
- Log aggregation services
- Container orchestration platforms (Kubernetes, Docker Swarm)
