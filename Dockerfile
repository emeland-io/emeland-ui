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

# config.js is overwritten at deploy time by the Helm chart's ConfigMap.
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
