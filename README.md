# 🎬 Social Image & Video Generator

Generador profesional de imágenes y videos sociales con efectos glassmorphism y fondos dinámicos. Perfecto para crear contenido atractivo para Twitter, Instagram, LinkedIn y otras redes sociales.

## ✨ Características

- 🎨 **Generación de Imágenes**: Crea imágenes estáticas con efectos glassmorphism
- 🎥 **Generación de Videos**: Videos animados con overlays dinámicos
- 🌟 **Efectos Glassmorphism**: Diseños modernos con transparencias y bordes difuminados
- 🎭 **Múltiples Avatares**: Galería de avatares predefinidos
- 🌄 **Fondos Dinámicos**: 70+ videos B-roll categorizados por temática
- 📱 **Múltiples Proporciones**: Soporte para todas las redes sociales
- ⚡ **API RESTful**: Integración fácil con cualquier aplicación

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- FFmpeg instalado en el sistema
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/psychito/socialimggen.git
cd socialimggen

# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend
cd client && npm install && cd ..

# Crear directorios necesarios
npm run setup

# Iniciar servidor de desarrollo
npm run dev

# En otra terminal, iniciar frontend
cd client && npm run dev
```

El backend estará en `http://localhost:3000` y el frontend en `http://localhost:5173`.

## 📋 API Documentación

### Base URL
```
http://localhost:3000/api
```

### 🖼️ Generación de Imágenes

#### POST `/api/image/generate`

Genera una imagen social estática con efectos glassmorphism.

**Request Body:**
```json
{
  "tweetData": {
    "displayName": "Alexander Urbina",
    "username": "@lexurbinac",
    "avatar": "/uploads/avatars/lex.jpg",
    "timestamp": "05 jul 2025",
    "text": "Tu mensaje aquí",
    "likes": 42,
    "retweets": 15,
    "replies": 8,
    "views": 1467,
    "verified": false,
    "theme": "dark"
  },
  "options": {
    "aspectRatio": "4:5",
    "quality": "high",
    "backgroundType": "blue",
    "backgroundVideo": "/videos/nature/forest-wind1.mp4",
    "enableOverlay": true,
    "overlayBlur": 8,
    "width": 1200,
    "height": 1500,
    "format": "png"
  }
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "/output/social-image-uuid.png"
}
```

### 🎥 Generación de Videos

#### POST `/api/video/generate` o `/api/video`

Genera un video social animado con overlays glassmorphism.

**Request Body (Formato Simple):**
```json
{
  "name": "Alexander Urbina",
  "username": "@lexurbinac",
  "avatarUrl": "/uploads/avatars/lex.jpg",
  "date": "05 jul 2025",
  "text": "Tu mensaje aquí",
  "likes": 42,
  "comments": 8,
  "retweets": 15,
  "views": 1467,
  "backgroundVideo": "/videos/nature/forest-wind1.mp4",
  "options": {
    "aspectRatio": "4:5",
    "quality": "high",
    "overlayBlur": 8
  }
}
```

**Request Body (Formato Completo):**
```json
{
  "tweetData": {
    "displayName": "Alexander Urbina",
    "username": "@lexurbinac",
    "avatar": "/uploads/avatars/lex.jpg",
    "timestamp": "05 jul 2025",
    "text": "Tu mensaje aquí",
    "likes": 42,
    "retweets": 15,
    "replies": 8,
    "views": 1467,
    "verified": false,
    "theme": "dark"
  },
  "options": {
    "aspectRatio": "4:5",
    "quality": "high",
    "backgroundVideo": "/videos/nature/forest-wind1.mp4",
    "duration": 10,
    "fps": 30,
    "overlayBlur": 8
  }
}
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "/output/social-video-uuid.mp4",
  "duration": 10,
  "size": "2.5MB",
  "format": "mp4"
}
```

### 📁 Recursos Disponibles

#### GET `/api/video/list`
Lista todos los videos de fondo disponibles.

#### GET `/api/upload/avatars`
Lista todos los avatares disponibles.

#### GET `/api/video/presets`
Obtiene presets predefinidos para diferentes tipos de contenido.

#### GET `/api/video/formats`
Lista formatos y resoluciones soportados.

## 🎭 Avatares Disponibles

| Avatar | Descripción | Tamaño | Uso Recomendado |
|--------|-------------|--------|-----------------|
| `bra.jpeg` | Avatar profesional femenino | 121.1KB | Contenido corporativo, tech |
| `giova.jpeg` | Avatar casual joven | 754.2KB | Contenido lifestyle, viajes |
| `lex.jpg` | Avatar masculino profesional | 4.2KB | Contenido técnico, educativo |

**URLs de Avatares:**
- `/uploads/avatars/bra.jpeg`
- `/uploads/avatars/giova.jpeg`
- `/uploads/avatars/lex.jpg`

## 🌄 Videos de Fondo Disponibles

### 🌿 Nature (Naturaleza)
Perfectos para contenido inspiracional, wellness y mindfulness.

| Video | Descripción | Cuándo Usar |
|-------|-------------|-------------|
| `forest-wind1.mp4` | Bosque con viento suave | Reflexiones, meditación |
| `forest-wind2.mp4` | Árboles en movimiento | Crecimiento personal |
| `forest-wind3.mp4` | Follaje verde vibrante | Contenido eco-friendly |
| `mountain-drone1.mp4` | Vista aérea montañas | Logros, metas |
| `mountain-drone2.mp4` | Paisaje montañoso | Desafíos, perseverancia |
| `mountain-drone3.mp4` | Cordillera nevada | Claridad mental |
| `mountain-vista1.mp4` | Panorámica montañas | Visión de futuro |
| `mountain-vista2.mp4` | Amanecer montañoso | Nuevos comienzos |
| `mountain-vista3.mp4` | Atardecer dorado | Reflexiones profundas |
| `mountain-vista4.mp4` | Niebla en montañas | Misterio, descubrimiento |
| `ocean-waves2.mp4` | Olas suaves | Calma, tranquilidad |
| `ocean-waves3.mp4` | Mar en movimiento | Fluidez, adaptación |
| `ocean-waves4.mp4` | Costa serena | Paz interior |
| `sunrise-drone1.mp4` | Amanecer aéreo | Nuevas oportunidades |
| `sunrise-drone2.mp4` | Alba dorada | Esperanza, optimismo |
| `sunrise-drone3.mp4` | Primeros rayos | Despertar, inicio |

### 🏢 Business (Negocios)
Ideales para contenido corporativo, networking y profesional.

| Video | Descripción | Cuándo Usar |
|-------|-------------|-------------|
| `corporate1.mp4` | Oficina moderna | Anuncios corporativos |
| `corporate2.mp4` | Ambiente ejecutivo | Liderazgo, management |
| `corporate3.mp4` | Espacios colaborativos | Trabajo en equipo |
| `corporate4.mp4` | Reuniones profesionales | Networking, partnerships |
| `handshake1.mp4` | Apretón de manos | Acuerdos, alianzas |
| `handshake2.mp4` | Negociación exitosa | Cierres de ventas |
| `handshake3.mp4` | Partnership | Colaboraciones |
| `handshake4.mp4` | Confianza mutua | Relaciones duraderas |
| `meeting-room1.mp4` | Sala de juntas | Presentaciones importantes |
| `meeting-room2.mp4` | Conferencia | Anuncios estratégicos |
| `meeting-room3.mp4` | Brainstorming | Ideas innovadoras |
| `meeting-room4.mp4` | Decisiones ejecutivas | Cambios organizacionales |
| `office-space1.mp4` | Espacio de trabajo | Cultura empresarial |
| `office-space2.mp4` | Ambiente dinámico | Productividad |
| `serene-office1.mp4` | Oficina tranquila | Work-life balance |
| `serene-office2.mp4` | Concentración | Deep work |
| `serene-office3.mp4` | Minimalismo | Eficiencia |
| `serene-office4.mp4` | Orden y claridad | Organización |

### 💻 Tech (Tecnología)
Perfectos para contenido de programación, innovación y tecnología.

| Video | Descripción | Cuándo Usar |
|-------|-------------|-------------|
| `coding-screen1.mp4` | Código en pantalla | Tutoriales de programación |
| `coding-screen2.mp4` | Desarrollo software | Lanzamientos de productos |
| `server-room.mp4` | Centro de datos | Infraestructura, cloud |
| `server-room2.mp4` | Servidores activos | Big data, procesamiento |
| `server-room3.mp4` | Tecnología avanzada | Innovación tech |
| `server-room4.mp4` | Conectividad | Redes, internet |

### 🏙️ Urban (Urbano)
Ideales para lifestyle, emprendimiento y vida citadina.

| Video | Descripción | Cuándo Usar |
|-------|-------------|-------------|
| `city-lights1.mp4` | Luces nocturnas | Vida nocturna, energía |
| `city-lights2.mp4` | Rascacielos iluminados | Ambición, progreso |
| `city-lights3.mp4` | Movimiento urbano | Dinamismo |
| `city-lights4.mp4` | Metrópoli vibrante | Oportunidades |
| `skyscrapers1.mp4` | Edificios altos | Crecimiento, expansión |
| `skyscrapers2.mp4` | Arquitectura moderna | Innovación, diseño |
| `skyscrapers3.mp4` | Vista urbana | Perspectiva amplia |
| `traffic-flow.1.mp4` | Tráfico fluido | Movimiento, progreso |
| `traffic-flow.2.mp4` | Calles dinámicas | Actividad constante |
| `traffic-flow.3.mp4` | Vida en movimiento | Ritmo acelerado |
| `urban-rain1.mp4` | Lluvia en ciudad | Reflexión, tranquilidad |
| `urban-rain2.mp4` | Gotas en cristal | Claridad, transparencia |
| `urban-rain3.mp4` | Ambiente lluvioso | Comodidad, introspección |
| `urban-rain4.mp4` | Ciudad mojada | Renovación, limpieza |

### 🎨 Abstract (Abstracto)
Perfectos para contenido creativo, artístico y conceptual.

| Video | Descripción | Cuándo Usar |
|-------|-------------|-------------|
| `color-waves1.mp4` | Ondas de color | Creatividad, arte |
| `color-waves2.mp4` | Gradientes fluidos | Transiciones, cambios |
| `color-waves3.mp4` | Movimiento colorido | Expresión artística |
| `geometric-shapes1.mp4` | Formas geométricas | Estructura, orden |
| `geometric-shapes2.mp4` | Patrones dinámicos | Diseño, arquitectura |
| `geometric-shapes3.mp4` | Composición abstracta | Conceptos complejos |
| `geometric-shapes4.mp4` | Simetría en movimiento | Precisión, perfección |
| `light-rays1.mp4` | Rayos de luz | Inspiración, revelación |
| `light-rays2.mp4` | Haces luminosos | Claridad, entendimiento |
| `light-rays3.mp4` | Iluminación suave | Calidez, acogida |
| `light-rays4.mp4` | Brillo intenso | Energía, poder |
| `particles1.mp4` | Partículas flotantes | Ciencia, tecnología |
| `particles2.mp4` | Movimiento molecular | Investigación, descubrimiento |
| `particles3.mp4` | Elementos dinámicos | Innovación, experimento |
| `particles4.mp4` | Flujo de datos | Información, conocimiento |

## ⚙️ Opciones de Configuración

### 📐 Proporciones (aspectRatio)

| Proporción | Descripción | Dimensiones | Uso Recomendado |
|------------|-------------|-------------|-----------------|
| `"9:16"` | Vertical | 1080x1920 | Instagram Stories, TikTok, YouTube Shorts |
| `"4:5"` | Instagram Post | 1080x1350 | Instagram feed, Facebook |
| `"3:4"` | Clásico vertical | 1080x1440 | Pinterest, retrato |
| `"1:1"` | Cuadrado | 1080x1080 | Instagram cuadrado, perfil |
| `"16:9"` | Horizontal | 1920x1080 | YouTube, LinkedIn, Twitter |

### 🎯 Calidad (quality)

| Valor | Descripción | Tiempo Procesamiento | Tamaño Archivo |
|-------|-------------|---------------------|----------------|
| `"low"` | Baja calidad | Muy rápido | Pequeño |
| `"medium"` | Calidad media | Rápido | Moderado |
| `"high"` | Alta calidad | **Recomendado** | Bueno |
| `"ultra"` | Máxima calidad | Lento | Grande |

### 🎨 Tipos de Fondo (backgroundType)

| Tipo | Descripción | Cuándo Usar |
|------|-------------|-------------|
| `"white"` | Fondo blanco sólido | Contenido minimalista, texto oscuro |
| `"blue"` | Gradiente azul Twitter | Contenido social, posts casuales |
| `"gradient"` | Gradiente colorido | Contenido creativo, anuncios |
| `"video-frame"` | Frame de video | Consistencia visual con video |

### 🌟 Overlay y Efectos

#### enableOverlay (boolean)
- `true`: Muestra contenedor glassmorphism con transparencia
- `false`: Texto directo sobre el fondo

#### overlayBlur (número)
- **Rango**: 0-20
- **Recomendado**: 8-12
- **Efecto**: Intensidad del desenfoque del fondo

### 📊 Estadísticas del Tweet

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `likes` | number | Número de likes | 42 |
| `retweets` | number | Número de retweets | 15 |
| `replies` | number | Número de comentarios | 8 |
| `views` | number | Número de visualizaciones | 1467 |

### 👤 Información del Usuario

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `displayName` | string | Nombre mostrado | "Alexander Urbina" |
| `username` | string | Handle/usuario | "@lexurbinac" |
| `verified` | boolean | Cuenta verificada | false |
| `avatar` | string | URL del avatar | "/uploads/avatars/lex.jpg" |

## 💡 Guía de Uso

### 🖼️ Cuándo Usar Imágenes

- **Posts estáticos** en redes sociales
- **Quotes** e frases inspiracionales
- **Anuncios** sin movimiento
- **Testimonials** de clientes
- **Infografías** simples
- **Thumbnails** personalizados

### 🎥 Cuándo Usar Videos

- **Contenido dinámico** para redes sociales
- **Anuncios animados** con mayor engagement
- **Stories** de Instagram/Facebook
- **TikToks** y Reels
- **Presentaciones** de productos
- **Contenido viral** con movimiento

### 🎨 Selección de Fondos

#### Para Contenido Profesional:
- **Business**: Anuncios corporativos, networking
- **Tech**: Lanzamientos de productos, tutoriales

#### Para Contenido Personal:
- **Nature**: Reflexiones, wellness, mindfulness
- **Urban**: Lifestyle, emprendimiento

#### Para Contenido Creativo:
- **Abstract**: Arte, diseño, conceptos creativos

## 🔧 Desarrollo

### Estructura del Proyecto

```
socialimggen/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── App.tsx        # Componente principal
│   │   └── main.tsx       # Punto de entrada
│   └── public/
│       └── placeholder.png # Imagen por defecto
├── src/                   # Backend Node.js + TypeScript
│   ├── routes/           # Rutas de la API
│   │   ├── image.ts     # Generación de imágenes
│   │   ├── video.ts     # Generación de videos
│   │   └── upload.ts    # Gestión de archivos
│   ├── services/        # Lógica de negocio
│   │   ├── imageGenerator.ts
│   │   ├── videoGenerator.ts
│   │   └── backgroundSelector.ts
│   ├── utils/           # Utilidades
│   │   ├── canvas.ts    # Renderizado
│   │   ├── ffmpeg.ts    # Procesamiento video
│   │   └── fileUtils.ts # Archivos
│   └── types/           # Definiciones TypeScript
├── videos/              # Videos de fondo categorizados
│   ├── nature/
│   ├── business/
│   ├── tech/
│   ├── urban/
│   └── abstract/
├── uploads/             # Avatares subidos
├── output/              # Archivos generados
└── temp/                # Archivos temporales
```

### Comandos de Desarrollo

```bash
# Desarrollo
npm run dev              # Backend desarrollo
cd client && npm run dev # Frontend desarrollo

# Producción
npm run build           # Compilar backend
npm start              # Servidor producción
cd client && npm run build # Compilar frontend

# Utilidades
npm run setup          # Crear directorios
npm run cleanup        # Limpiar archivos temporales
npm test              # Tests básicos
```

### Variables de Entorno

```env
# Server
PORT=3000
NODE_ENV=development
PUBLIC_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# CORS
ENABLE_CORS=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=info
```

## 🚦 Rate Limiting

La API incluye rate limiting para prevenir abuso:

- **Límite**: 100 requests por 15 minutos por IP
- **Headers de respuesta**: `Retry-After` cuando se excede
- **Código HTTP**: 429 Too Many Requests

## 📝 Ejemplos de Uso

### Imagen Simple

```bash
curl -X POST http://localhost:3000/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "tweetData": {
      "displayName": "John Doe",
      "username": "@johndoe",
      "text": "Hello World!",
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

### Video Dinámico

```bash
curl -X POST http://localhost:3000/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "username": "@janesmith",
    "text": "Excited to share this!",
    "likes": 25,
    "backgroundVideo": "/videos/nature/forest-wind1.mp4",
    "options": {
      "aspectRatio": "9:16",
      "quality": "high"
    }
  }'
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

**Psychito** - [GitHub](https://github.com/psychito)

## 🙏 Reconocimientos

- FFmpeg por el procesamiento de video
- Canvas API por el renderizado
- Todos los contributors del proyecto

---

**¿Necesitas ayuda?** Abre un [issue](https://github.com/psychito/socialimggen/issues) en GitHub.