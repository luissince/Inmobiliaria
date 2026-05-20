# Etapa 1: Construcción del frontend con Vite
FROM node:18-alpine AS front-end

# Establecer el directorio de trabajo en /app
WORKDIR /app

# Copiar solo los archivos necesarios para instalar dependencias
COPY package.json package-lock.json ./

# Instalar dependencias de frontend
RUN npm install --frozen-lockfile 

# Copiar el resto de los archivos y construir el frontend
COPY . .

RUN npm run build