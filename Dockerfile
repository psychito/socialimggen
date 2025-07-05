# Dockerfile para Social Video Generator
FROM node:18-alpine AS base

# Instalar dependencias del sistema para FFmpeg y Canvas
RUN apk update && apk add --no-cache \
    ffmpeg \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    gif-dev \
    librsvg-dev \
    pixman-dev \
    cairo-gobject-dev \
    fontconfig-dev \
    freetype-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Crear usuario no root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p output temp uploads logs videos/tech videos/nature videos/urban videos/abstract videos/business videos/custom fonts

# Compilar TypeScript
RUN npm run build

# Cambiar propietario de archivos al usuario no root
RUN chown -R appuser:nodejs /app

# Cambiar a usuario no root
USER appuser

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_MAX_SIZE=100
ENV MAX_OUTPUT_FILES=1000
ENV CLEANUP_TEMP_FILES=true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["npm", "start"]

# === Multi-stage build para desarrollo ===
FROM base AS development

# Cambiar de vuelta a root para instalar dependencias de desarrollo
USER root

# Instalar dependencias de desarrollo
RUN npm ci && npm cache clean --force

# Instalar nodemon globalmente
RUN npm install -g nodemon

# Cambiar de vuelta al usuario no root
USER appuser

# Comando para desarrollo
CMD ["npm", "run", "dev"]

# === Etapa de construcción para el cliente (opcional) ===
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copiar archivos del cliente
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# === Etapa final de producción ===
FROM base AS production

# Copiar build del cliente si existe
COPY --from=client-builder /app/client/dist /app/client/dist

# El resto ya está configurado en la etapa base
USER appuser
CMD ["npm", "start"]