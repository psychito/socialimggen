#!/bin/bash

# setup.sh - Script de instalación y configuración automática
# Uso: ./setup.sh [--dev|--prod|--docker]

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt &> /dev/null; then
            OS="ubuntu"
        elif command -v yum &> /dev/null; then
            OS="centos"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    log_info "Sistema operativo detectado: $OS"
}

# Verificar dependencias del sistema
check_system_dependencies() {
    log_info "Verificando dependencias del sistema..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Por favor instala Node.js 18+ antes de continuar."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    if [[ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]]; then
        log_error "Node.js versión 18+ requerida. Versión actual: $NODE_VERSION"
        exit 1
    fi
    log_success "Node.js $NODE_VERSION ✓"
    
    # NPM
    if ! command -v npm &> /dev/null; then
        log_error "NPM no está instalado"
        exit 1
    fi
    log_success "NPM $(npm --version) ✓"
    
    # FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
        log_warning "FFmpeg no está instalado. La generación de videos no funcionará."
        read -p "¿Deseas instalar FFmpeg automáticamente? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_ffmpeg
        fi
    else
        log_success "FFmpeg $(ffmpeg -version | head -n 1 | cut -d' ' -f3) ✓"
    fi
}

# Instalar FFmpeg según el OS
install_ffmpeg() {
    log_info "Instalando FFmpeg..."
    
    case $OS in
        "ubuntu")
            sudo apt update
            sudo apt install -y ffmpeg
            ;;
        "centos")
            sudo yum install -y epel-release
            sudo yum install -y ffmpeg
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install ffmpeg
            else
                log_error "Homebrew no está instalado. Instala Homebrew primero."
                exit 1
            fi
            ;;
        *)
            log_error "Instalación automática de FFmpeg no soportada para $OS"
            log_info "Por favor instala FFmpeg manualmente desde: https://ffmpeg.org/download.html"
            ;;
    esac
}

# Instalar dependencias de Canvas según el OS
install_canvas_dependencies() {
    log_info "Instalando dependencias para Canvas..."
    
    case $OS in
        "ubuntu")
            sudo apt update
            sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
            ;;
        "centos")
            sudo yum groupinstall -y "Development Tools"
            sudo yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install cairo pango libpng jpeg giflib librsvg pixman
            else
                log_error "Homebrew no está instalado"
                exit 1
            fi
            ;;
        *)
            log_warning "Instalación automática de dependencias de Canvas no soportada para $OS"
            ;;
    esac
}

# Crear estructura de directorios
create_directories() {
    log_info "Creando estructura de directorios..."
    
    directories=(
        "output"
        "temp"
        "uploads"
        "uploads/avatars"
        "logs"
        "videos/tech"
        "videos/nature"
        "videos/urban"
        "videos/abstract"
        "videos/business"
        "videos/custom"
        "fonts"
        "client/dist"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log_success "Directorio creado: $dir"
    done
}

# Configurar variables de entorno
setup_environment() {
    log_info "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Archivo .env creado desde .env.example"
        
        # Generar valores por defecto
        if [[ "$1" == "prod" ]]; then
            sed -i.bak 's/NODE_ENV=development/NODE_ENV=production/' .env
            sed -i.bak 's|PUBLIC_URL=http://localhost:3000|PUBLIC_URL=https://tu-dominio.com|' .env
            rm .env.bak 2>/dev/null || true
            log_info "Configuración de producción aplicada"
        fi
        
        log_warning "IMPORTANTE: Edita el archivo .env con tus configuraciones específicas"
    else
        log_info "Archivo .env ya existe, omitiendo..."
    fi
}

# Instalar dependencias de Node.js
install_node_dependencies() {
    log_info "Instalando dependencias de Node.js..."
    
    if [[ "$1" == "dev" ]]; then
        npm install
        log_success "Dependencias de desarrollo instaladas"
    else
        npm ci --only=production
        log_success "Dependencias de producción instaladas"
    fi
}

# Compilar proyecto
build_project() {
    log_info "Compilando proyecto TypeScript..."
    npm run build
    log_success "Proyecto compilado exitosamente"
}

# Descargar videos de muestra
download_sample_videos() {
    log_info "¿Deseas descargar videos de muestra? (Esto puede tomar algunos minutos)"
    read -p "[y/N] " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Descargando videos de muestra..."
        
        # URLs de videos de muestra (Creative Commons)
        declare -A sample_videos=(
            ["videos/tech/coding.mp4"]="https://sample-videos.com/zip/10/mp4/480/mp4/SampleVideo_360x240_1mb.mp4"
            ["videos/nature/ocean.mp4"]="https://sample-videos.com/zip/10/mp4/480/mp4/SampleVideo_640x360_1mb.mp4"
            ["videos/urban/city.mp4"]="https://sample-videos.com/zip/10/mp4/480/mp4/SampleVideo_720x480_1mb.mp4"
            ["videos/abstract/particles.mp4"]="https://sample-videos.com/zip/10/mp4/480/mp4/SampleVideo_1280x720_1mb.mp4"
            ["videos/business/office.mp4"]="https://sample-videos.com/zip/10/mp4/480/mp4/SampleVideo_1920x1080_1mb.mp4"
        )
        
        for video_path in "${!sample_videos[@]}"; do
            if [ ! -f "$video_path" ]; then
                log_info "Descargando $(basename "$video_path")..."
                curl -L -o "$video_path" "${sample_videos[$video_path]}" || {
                    log_warning "Error descargando $video_path"
                }
            fi
        done
        
        log_success "Videos de muestra descargados"
    else
        log_info "Puedes agregar tus propios videos a los directorios en videos/"
    fi
}

# Configurar PM2 (solo para producción)
setup_pm2() {
    if [[ "$1" == "prod" ]]; then
        log_info "Configurando PM2..."
        
        if ! command -v pm2 &> /dev/null; then
            log_info "Instalando PM2..."
            npm install -g pm2
        fi
        
        log_success "PM2 configurado. Usa 'npm run pm2:start' para iniciar en producción"
    fi
}

# Configurar Docker
setup_docker() {
    log_info "Configurando Docker..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi
    
    # Construir imagen
    log_info "Construyendo imagen de Docker..."
    docker-compose build
    
    log_success "Docker configurado. Usa 'docker-compose up' para iniciar"
}

# Verificar instalación
verify_installation() {
    log_info "Verificando instalación..."
    
    # Verificar que se pueda importar el servidor
    if node -e "require('./dist/server.js')" 2>/dev/null; then
        log_error "Error en la compilación del servidor"
        return 1
    fi
    
    # Verificar directorios
    for dir in "output" "temp" "uploads" "logs"; do
        if [ ! -d "$dir" ]; then
            log_error "Directorio faltante: $dir"
            return 1
        fi
    done
    
    log_success "Instalación verificada correctamente"
}

# Mostrar información final
show_final_info() {
    echo
    echo "🎉 ¡Instalación completada exitosamente!"
    echo
    echo "📋 Próximos pasos:"
    echo "   1. Edita el archivo .env con tus configuraciones"
    echo "   2. Agrega videos de fondo a los directorios en videos/"
    echo "   3. Inicia el servidor:"
    
    case $1 in
        "dev")
            echo "      npm run dev              # Desarrollo"
            ;;
        "prod")
            echo "      npm run pm2:start        # Producción con PM2"
            echo "      npm start                # Producción simple"
            ;;
        "docker")
            echo "      docker-compose up        # Con Docker"
            ;;
        *)
            echo "      npm run dev              # Desarrollo"
            echo "      npm start                # Producción"
            ;;
    esac
    
    echo
    echo "🌐 El servidor estará disponible en: http://localhost:3000"
    echo "📚 Documentación: http://localhost:3000/docs"
    echo "🔍 Health check: http://localhost:3000/health"
    echo
    echo "📁 Estructura del proyecto:"
    echo "   • videos/     - Videos de fondo por categoría"
    echo "   • fonts/      - Fuentes personalizadas"
    echo "   • output/     - Videos e imágenes generadas"
    echo "   • uploads/    - Archivos subidos por usuarios"
    echo "   • logs/       - Logs del sistema"
    echo
}

# Función principal
main() {
    echo "🎬 Social Video Generator - Script de Instalación"
    echo "=================================================="
    echo
    
    MODE=${1:-"dev"}
    
    case $MODE in
        "--dev"|"dev")
            MODE="dev"
            log_info "Modo: Desarrollo"
            ;;
        "--prod"|"prod")
            MODE="prod"
            log_info "Modo: Producción"
            ;;
        "--docker"|"docker")
            MODE="docker"
            log_info "Modo: Docker"
            ;;
        *)
            log_info "Modo: Desarrollo (por defecto)"
            MODE="dev"
            ;;
    esac
    
    # Detectar sistema operativo
    detect_os
    
    # Solo para Docker
    if [[ "$MODE" == "docker" ]]; then
        setup_docker
        show_final_info "docker"
        exit 0
    fi
    
    # Verificar dependencias del sistema
    check_system_dependencies
    
    # Instalar dependencias de Canvas si es necesario
    install_canvas_dependencies
    
    # Crear estructura de directorios
    create_directories
    
    # Configurar variables de entorno
    setup_environment "$MODE"
    
    # Instalar dependencias de Node.js
    install_node_dependencies "$MODE"
    
    # Compilar proyecto (solo si no es desarrollo puro)
    if [[ "$MODE" != "dev" ]]; then
        build_project
    fi
    
    # Descargar videos de muestra
    download_sample_videos
    
    # Configurar PM2 para producción
    setup_pm2 "$MODE"
    
    # Verificar instalación
    verify_installation
    
    # Mostrar información final
    show_final_info "$MODE"
}

# Ejecutar función principal con argumentos
main "$@"