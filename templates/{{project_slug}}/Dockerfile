
# Default development Dockerfile for My Project
FROM node:20-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
CMD ["pnpm", "dev"]
