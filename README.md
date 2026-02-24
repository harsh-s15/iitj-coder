# IITJ Coder - Setup Guide

## Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/install/)
- Java 17 or higher
- Maven 3.6 or higher

## Infrastructure Setup (PostgreSQL & Redis)
Instead of installing PostgreSQL and Redis manually, you can run them using Docker Compose:

```bash
docker-compose up -d
```
This will:
1. Start **PostgreSQL** on port `5431` (User: `postgres`, Pass: `root`, DB: `iitj_coder`).
2. Automatically run `schema.sql` to initialize the tables.
3. Start **Redis** on port `6379`.

## Component Setup

### 1. Spring Boot Backend
```bash
cd springboot
./mvnw spring-boot:run
```

### 2. Compiler Service
Ensure Docker is running, then:
```bash
cd compiler-service
./mvnw spring-boot:run
```

### 3. Student Client
```bash
cd student-client
npm install
npm run dev
```

### 3. Admin Client
```bash
cd admin-client
npm install
npm run dev
```
