# --- Etapa 1: build do frontend Angular ---
FROM node:24-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./
RUN npx ng build --configuration production

# --- Etapa 2: backend + arquivos estáticos do frontend ---
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY src ./src
COPY README.md ./README.md
COPY --from=frontend-build /app/frontend/dist/ia-translate-frontend/browser ./public

ENV NODE_ENV=production
ENV DATA_DIR=/config
EXPOSE 3000

CMD ["node", "src/app.js"]
