# Imagen base: Linux liviano con Node 22
FROM node:22-slim

WORKDIR /app

# Primero solo las dependencias: así Docker las reutiliza
# entre builds si el package.json no cambió
COPY package*.json ./
RUN npm ci

# Después el código, y compilamos TypeScript a JavaScript (carpeta dist)
COPY . .
RUN npm run build

CMD ["node", "dist/main"]