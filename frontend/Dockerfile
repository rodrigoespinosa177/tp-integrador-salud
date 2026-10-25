#  Etapa 1: compilar la app con Node 
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# En Vite, las variables VITE_ se graban en el código al compilar,
# por eso se pasan acá como argumentos de construcción
ARG VITE_USE_MOCKS_USUARIOS=false
ARG VITE_USE_MOCKS_TURNOS=true
ARG VITE_API_USUARIOS_URL=http://localhost:3000
ARG VITE_API_TURNOS_URL=http://localhost:3000
ENV VITE_USE_MOCKS_USUARIOS=$VITE_USE_MOCKS_USUARIOS \
    VITE_USE_MOCKS_TURNOS=$VITE_USE_MOCKS_TURNOS \
    VITE_API_USUARIOS_URL=$VITE_API_USUARIOS_URL \
    VITE_API_TURNOS_URL=$VITE_API_TURNOS_URL

RUN npm run build

# Etapa 2: servir los archivos con Nginx 
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80