# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite the Vite public/config.js (which carries the dev-only
# "dev-root-admin" hash) with a fail-closed production default. The Helm chart
# mounts its own ConfigMap over this path to provide the real runtime config.
COPY deploy/nginx/config.prod.js /usr/share/nginx/html/config.js

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
