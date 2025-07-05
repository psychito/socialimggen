# 🚀 Despliegue en Servidor Hetzner

Guía completa para desplegar el Social Image Generator en un servidor Hetzner con Ubuntu + Nginx.

## 📋 Prerrequisitos

- Servidor Ubuntu 20.04+ en Hetzner
- Acceso SSH root o sudo
- Dominio apuntando a tu servidor (opcional pero recomendado)

## 🔧 Paso 1: Preparar el Servidor

### Conectar al servidor
```bash
ssh root@tu-servidor-ip
# o
ssh usuario@tu-servidor-ip
```

### Actualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar dependencias básicas
```bash
sudo apt install -y curl wget git build-essential
```

## 📦 Paso 2: Instalar Node.js

### Instalar Node.js 18+ (recomendado)
```bash
# Agregar repositorio NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version   # Debe mostrar 9.x.x o superior
```

## 🎬 Paso 3: Instalar FFmpeg

```bash
# Instalar FFmpeg
sudo apt install -y ffmpeg

# Verificar instalación
ffmpeg -version
```

## 🌐 Paso 4: Instalar y Configurar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar y habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

## 📁 Paso 5: Clonar y Configurar el Proyecto

### Crear directorio de aplicaciones
```bash
sudo mkdir -p /var/www
cd /var/www
```

### Clonar repositorio
```bash
# Opción 1: Si tienes acceso al repo
sudo git clone https://github.com/psychito/socialimggen.git
sudo chown -R $USER:$USER /var/www/socialimggen

# Opción 2: Subir archivos manualmente
# Puedes usar scp, rsync o FileZilla para subir los archivos
```

### Configurar el proyecto
```bash
cd /var/www/socialimggen

# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd client
npm install
cd ..

# Crear directorios necesarios
npm run setup

# Construir proyecto
npm run build
cd client && npm run build && cd ..
```

## ⚙️ Paso 6: Configurar Variables de Entorno

```bash
# Crear archivo de configuración
sudo nano /var/www/socialimggen/.env
```

Agregar el siguiente contenido:
```env
# Server
PORT=3000
NODE_ENV=production
PUBLIC_URL=https://tu-dominio.com

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# CORS
ENABLE_CORS=true
ALLOWED_ORIGINS=https://tu-dominio.com

# Logging
LOG_LEVEL=info

# Security
TRUST_PROXY=true
```

## 🔒 Paso 7: Configurar Nginx

### Crear configuración del sitio
```bash
sudo nano /etc/nginx/sites-available/socialimggen
```

Agregar la siguiente configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirigir a HTTPS (después de configurar SSL)
    # return 301 https://$server_name$request_uri;
    
    # Configuración temporal para HTTP
    root /var/www/socialimggen/client/dist;
    index index.html;
    
    # Límites de archivo para uploads
    client_max_body_size 100M;
    
    # Logs
    access_log /var/log/nginx/socialimggen_access.log;
    error_log /var/log/nginx/socialimggen_error.log;
    
    # Servir archivos estáticos del frontend
    location / {
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
    
    # Proxy para API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para generación de videos
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Servir archivos generados
    location /output/ {
        alias /var/www/socialimggen/output/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Servir videos de fondo
    location /videos/ {
        alias /var/www/socialimggen/videos/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # Servir avatares
    location /uploads/ {
        alias /var/www/socialimggen/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Servir archivos estáticos con cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Ocultar información del servidor
    server_tokens off;
}
```

### Habilitar el sitio
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/socialimggen /etc/nginx/sites-enabled/

# Deshabilitar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

## 🔄 Paso 8: Configurar PM2 (Gestor de Procesos)

### Instalar PM2
```bash
sudo npm install -g pm2
```

### Crear archivo de configuración PM2
```bash
nano /var/www/socialimggen/ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [{
    name: 'socialimggen',
    script: 'dist/server.js',
    cwd: '/var/www/socialimggen',
    instances: 'max', // o número específico como 2
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

### Iniciar aplicación con PM2
```bash
cd /var/www/socialimggen

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Configurar PM2 para que inicie al boot
pm2 startup
# Ejecutar el comando que te muestre PM2

# Verificar estado
pm2 status
pm2 logs
```

## 🔒 Paso 9: Configurar SSL (Opcional pero Recomendado)

### Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtener certificado SSL
```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### Verificar renovación automática
```bash
sudo certbot renew --dry-run
```

## 🛡️ Paso 10: Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir conexiones necesarias
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Verificar reglas
sudo ufw status
```

## 📊 Paso 11: Configurar Logs y Monitoreo

### Crear rotación de logs
```bash
sudo nano /etc/logrotate.d/socialimggen
```

Contenido:
```
/var/www/socialimggen/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reload socialimggen
    endscript
}
```

### Configurar limpieza automática de archivos generados
```bash
# Crear script de limpieza
sudo nano /var/www/socialimggen/cleanup-files.sh
```

Contenido:
```bash
#!/bin/bash
# Limpiar archivos generados más antiguos de 1 día
find /var/www/socialimggen/output -name "*.mp4" -o -name "*.png" -o -name "*.jpg" | xargs -I {} find {} -mtime +1 -delete
find /var/www/socialimggen/temp -type f -mtime +1 -delete
```

```bash
# Hacer ejecutable
sudo chmod +x /var/www/socialimggen/cleanup-files.sh

# Agregar a crontab
sudo crontab -e
```

Agregar línea:
```
0 2 * * * /var/www/socialimggen/cleanup-files.sh
```

## ✅ Paso 12: Verificar Instalación

### Verificar servicios
```bash
# Estado de Nginx
sudo systemctl status nginx

# Estado de PM2
pm2 status

# Logs de la aplicación
pm2 logs socialimggen
```

### Probar endpoints
```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/

# Desde exterior (cambia la URL)
curl http://tu-dominio.com/health
```

### Probar generación
```bash
curl -X POST http://tu-dominio.com/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "tweetData": {
      "displayName": "Test User",
      "username": "@test",
      "text": "Hello from server!",
      "likes": 10,
      "retweets": 5,
      "replies": 2,
      "views": 100
    },
    "options": {
      "aspectRatio": "1:1",
      "backgroundType": "blue"
    }
  }'
```

## 🔧 Comandos Útiles para Administración

### PM2
```bash
pm2 restart socialimggen    # Reiniciar app
pm2 stop socialimggen       # Detener app
pm2 delete socialimggen     # Eliminar app
pm2 logs socialimggen       # Ver logs
pm2 monit                   # Monitor en tiempo real
```

### Nginx
```bash
sudo nginx -t                    # Verificar configuración
sudo systemctl reload nginx     # Recargar configuración
sudo systemctl restart nginx    # Reiniciar Nginx
```

### Logs
```bash
# Logs de Nginx
sudo tail -f /var/log/nginx/socialimggen_access.log
sudo tail -f /var/log/nginx/socialimggen_error.log

# Logs de la aplicación
tail -f /var/www/socialimggen/logs/combined.log
```

### Actualizar aplicación
```bash
cd /var/www/socialimggen

# Respaldar
pm2 stop socialimggen

# Actualizar código
git pull origin main  # o subir archivos nuevos

# Reinstalar dependencias si es necesario
npm install
cd client && npm install && cd ..

# Reconstruir
npm run build
cd client && npm run build && cd ..

# Reiniciar
pm2 restart socialimggen
```

## 🚨 Solución de Problemas

### La aplicación no inicia
```bash
# Verificar logs
pm2 logs socialimggen

# Verificar permisos
sudo chown -R $USER:$USER /var/www/socialimggen

# Verificar puerto
sudo netstat -tlnp | grep :3000
```

### Error 502 Bad Gateway
```bash
# Verificar que PM2 esté corriendo
pm2 status

# Verificar configuración Nginx
sudo nginx -t

# Reiniciar servicios
pm2 restart socialimggen
sudo systemctl restart nginx
```

### Archivos no se sirven
```bash
# Verificar permisos de archivos
ls -la /var/www/socialimggen/output/
ls -la /var/www/socialimggen/videos/

# Ajustar permisos si es necesario
sudo chmod -R 755 /var/www/socialimggen/
```

### FFmpeg no funciona
```bash
# Verificar instalación
which ffmpeg
ffmpeg -version

# Reinstalar si es necesario
sudo apt remove ffmpeg
sudo apt install ffmpeg
```

## 📱 Acceso desde el Frontend

Una vez configurado, podrás acceder a:

- **Frontend**: `http://tu-dominio.com`
- **API**: `http://tu-dominio.com/api/`
- **Health Check**: `http://tu-dominio.com/health`
- **Videos**: `http://tu-dominio.com/videos/`
- **Archivos generados**: `http://tu-dominio.com/output/`

## 🎯 Optimizaciones Adicionales

### Para servidores con poca memoria
```bash
# Configurar swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Para mejorar rendimiento
```bash
# Ajustar PM2 para usar menos instancias
pm2 delete socialimggen
pm2 start ecosystem.config.js --instances 1

# Optimizar Nginx
sudo nano /etc/nginx/nginx.conf
# Ajustar worker_processes y worker_connections
```

¡Tu aplicación debería estar funcionando perfectamente en tu servidor Hetzner!