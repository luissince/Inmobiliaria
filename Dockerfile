# Etapa 1: Construcción del frontend con Vite
FROM node:18-alpine AS front-end

# Establecer el directorio de trabajo en /app
WORKDIR /app

# Copiar solo los archivos necesarios para instalar dependencias
COPY app/package.json app/package-lock.json ./

# Instalar dependencias de frontend
RUN npm install --frozen-lockfile 

# Copiar el resto de los archivos y construir el frontend
COPY app/ ./
RUN npm run build

# Etapa 2: Configuración del backend y servidor
FROM node:18-alpine AS back-end

# Establecer el directorio de trabajo en /back-end
WORKDIR /back-end

# Copiar los archivos desde la etapa de construcción (front-end) al directorio del back-end para que lo sirva
COPY --chown=node:node --from=front-end /app/dist/ ./dist

# Copiar solo los archivos necesarios del backend
COPY server/package.json server/package-lock.json ./

# Instalar solo las dependencias de producción
RUN npm install --only=production 

# Copiar el resto de los archivos del backend
COPY server/ ./

# Cambiar al usuario no privilegiado (node) por razones de seguridad
USER node

# Asignar la propiedad de la carpeta al usuario 'node'
RUN chown -R node:node /back-end/src

# Exponer el puerto 80 para la aplicación
EXPOSE 80

# Establecer el punto de entrada para iniciar la aplicación
ENTRYPOINT ["npm", "start"]