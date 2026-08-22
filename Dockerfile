# ---- build: генерируем контракт и собираем SPA ----
FROM node:22-alpine AS build

ENV npm_config_registry=https://registry.npmjs.org/

WORKDIR /app

COPY package.json package-lock.json ./
# Лок-файлы сгенерированы с корпоративным реестром — переписываем его хостав публичный npmjs.
RUN sed -i 's#https://artifactory.mts.ai/artifactory/api/npm/common-npm-group/#https://registry.npmjs.org/#g' package-lock.json && npm ci

COPY main.tsp tspconfig.yaml ./
RUN npx tsp compile .

WORKDIR /app/front
COPY front/package.json front/package-lock.json ./
RUN sed -i 's#https://artifactory.mts.ai/artifactory/api/npm/common-npm-group/#https://registry.npmjs.org/#g' package-lock.json && npm ci

COPY front/ ./
RUN npm run generate:api && npm run build

# ---- runtime: backend + собранный frontend, запуск по PORT ----
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    STATIC_DIR=/app/front/dist

WORKDIR /app

COPY backend/package.json ./
COPY backend/src ./src
COPY --from=build /app/front/dist ./front/dist

EXPOSE 8080

CMD ["node", "src/index.js"]