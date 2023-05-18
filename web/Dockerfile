FROM node:18-alpine as build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY public/ public/
COPY src/ src/
RUN npm run build

FROM caddy:2.6.4-alpine
COPY --from=build /app/build /app
COPY Caddyfile /etc/caddy/
