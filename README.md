# Retailer Sales Representative App

This project is a full-stack application designed for Sales Representatives to manage retailer visits and orders. It includes a NestJS backend and a React (Vite) frontend.

## Tech Stack

- **Backend:** NestJS, Prisma (ORM), PostgreSQL, Redis (Caching)
- **Frontend:** React, Vite, Tailwind CSS
- **Infrastructure:** Docker, Docker Compose

## Prerequisites

- [Docker](https://www.docker.com/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/) (usually included with Docker Desktop).

## Setup and Startup

The entire application stack (Database, Redis, Backend, Frontend) can be launched using Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Start the application:**
    Run the following command in the root directory:
    ```bash
    docker-compose up --build
    ```
    *   The `--build` flag ensures that the Docker images are built from the latest source code.
    *   Add `-d` to run in detached mode (background): `docker-compose up --build -d`.

3.  **Access the application:**
    *   **Frontend:** Open [http://localhost:8080](http://localhost:8080) in your browser.
    *   **Backend API:** Accessible at [http://localhost:3000](http://localhost:3000).
    *   **Swagger Documentation:** [http://localhost:3000/api](http://localhost:3000/api) (if enabled) or check API routes.

## Database Seeding & Migrations

The Docker setup automatically runs migrations. If you need to reset or seed the database manually:

1.  **Access the backend container:**
    ```bash
    docker exec -it retailer_backend sh
    ```

2.  **Run migrations and seed:**
    ```bash
    npx prisma migrate deploy
    npx prisma db seed
    ```

## Development Info

- **Default Credentials:** (If seeded)
    - **Admin:** `admin` / `admin` (Check `seed.ts` for details)
- **Ports:**
    - Frontend: 8080
    - Backend: 3000
    - PostgreSQL: 5432
    - Redis: 6379

## Stopping the App

To stop the containers:
```bash
docker-compose down
```
To stop and remove volumes (reset database):
```bash
docker-compose down -v
```
