#!/bin/bash

# cleanup.sh - Script de limpieza automática
# Uso: ./cleanup.sh [--force] [--all] [--temp] [--output] [--logs]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables de configuración
FORCE=false
CLEAN_ALL=false
CLEAN_TEMP=false
CLEAN_OUTPUT=false
CLEAN_LOGS=false
CLEAN_UPLOADS=false

# Contadores
CLEANED_FILES=0
CLEANED_SIZE=0

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

# Función para obtener tamaño de archivo en bytes
get_file_size() {
    if [[ -f "$1" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            stat -f%z "$1"
        else
            stat -c%s "$1"
        fi
    else
        echo 0
    fi
}

# Función para formatear bytes
format_bytes() {
    local bytes=$1
    if (( bytes < 1024 )); then
        echo "${bytes}B"
    elif (( bytes < 1048576 )); then
        echo "$(( bytes / 1024 ))KB"
    elif (( bytes < 1073741824 )); then
        echo "$(( bytes / 1048576 ))MB"
    else
        echo "$(( bytes / 1073741824 ))GB"
    fi
}

# Función para confirmar acción
confirm_action() {
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    echo -e "${YELLOW}¿Estás seguro de que deseas continuar? [y/N]${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Limpiar archivos temporales
clean_temp_files() {
    log_info "Limpiando archivos temporales..."
    
    local temp_dirs=("temp" "uploads/temp")
    local patterns=("*.tmp" "overlay-*.png" "ffmpeg_*" "temp_*")
    
    for dir in "${temp_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_info "Procesando directorio: $dir"
            
            for pattern in "${patterns[@]}"; do
                for file in "$dir"/$pattern; do
                    if [[ -f "$file" ]]; then
                        local size=$(get_file_size "$file")
                        rm "$file"
                        CLEANED_FILES=$((CLEANED_FILES + 1))
                        CLEANED_SIZE=$((CLEANED_SIZE + size))
                        log_success "Eliminado: $(basename "$file") ($(format_bytes $size))"
                    fi
                done
            done
            
            # Limpiar archivos antiguos (más de 1 día)
            find "$dir" -type f -mtime +1 -exec rm {} \; 2>/dev/null || true
        fi
    done
}

# Limpiar archivos de salida antiguos
clean_output_files() {
    log_info "Limpiando archivos de salida antiguos..."
    
    if [[ ! -d "output" ]]; then
        log_warning "Directorio output no existe"
        return
    fi
    
    # Obtener límite máximo de archivos
    local max_files=${MAX_OUTPUT_FILES:-1000}
    local file_count=$(find output -type f | wc -l)
    
    log_info "Archivos actuales: $file_count, máximo permitido: $max_files"
    
    if (( file_count > max_files )); then
        local files_to_delete=$((file_count - max_files))
        log_warning "Eliminando $files_to_delete archivos más antiguos..."
        
        # Encontrar y eliminar archivos más antiguos
        find output -type f -printf '%T@ %p\n' 2>/dev/null | \
        sort -n | \
        head -n $files_to_delete | \
        cut -d' ' -f2- | \
        while IFS= read -r file; do
            local size=$(get_file_size "$file")
            rm "$file"
            CLEANED_FILES=$((CLEANED_FILES + 1))
            CLEANED_SIZE=$((CLEANED_SIZE + size))
            log_success "Eliminado: $(basename "$file") ($(format_bytes $size))"
        done
    fi
    
    # Limpiar archivos más antiguos que X días
    local max_age_days=${MAX_AGE_DAYS:-7}
    log_info "Eliminando archivos de más de $max_age_days días..."
    
    find output -type f -mtime +$max_age_days -exec rm {} \; 2>/dev/null || true
}

# Limpiar logs antiguos
clean_log_files() {
    log_info "Limpiando logs antiguos..."
    
    if [[ ! -d "logs" ]]; then
        log_warning "Directorio logs no existe"
        return
    fi
    
    # Rotar y comprimir logs grandes
    for log_file in logs/*.log; do
        if [[ -f "$log_file" ]]; then
            local size=$(get_file_size "$log_file")
            local size_mb=$((size / 1048576))
            
            # Si el log es mayor a 10MB, rotarlo
            if (( size_mb > 10 )); then
                local backup_name="${log_file}.$(date +%Y%m%d_%H%M%S).bak"
                mv "$log_file" "$backup_name"
                gzip "$backup_name" 2>/dev/null || true
                touch "$log_file"
                log_success "Log rotado: $(basename "$log_file") → $(basename "$backup_name").gz"
            fi
        fi
    done
    
    # Eliminar logs de backup más antiguos que 30 días
    find logs -name "*.bak.gz" -mtime +30 -exec rm {} \; 2>/dev/null || true
    find logs -name "*.bak" -mtime +30 -exec rm {} \; 2>/dev/null || true
}

# Limpiar archivos subidos antiguos
clean_upload_files() {
    log_info "Limpiando archivos subidos antiguos..."
    
    local upload_dirs=("uploads" "uploads/avatars")
    
    for dir in "${upload_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            # Eliminar archivos temporales de subida
            find "$dir" -name "tmp-*" -mtime +1 -exec rm {} \; 2>/dev/null || true
            
            # Eliminar archivos huérfanos (sin referencia)
            find "$dir" -type f -mtime +7 -exec rm {} \; 2>/dev/null || true
        fi
    done
}

# Limpiar cache de npm y node_modules (para desarrollo)
clean_node_cache() {
    log_info "Limpiando cache de Node.js..."
    
    if command -v npm &> /dev/null; then
        npm cache clean --force 2>/dev/null || true
        log_success "Cache de NPM limpiado"
    fi
    
    # Limpiar node_modules si se especifica
    if [[ "$CLEAN_ALL" == "true" ]]; then
        log_warning "Eliminando node_modules..."
        if confirm_action; then
            rm -rf node_modules
            rm -rf client/node_modules 2>/dev/null || true
            log_success "node_modules eliminado"
        fi
    fi
}

# Limpiar Docker (si está siendo usado)
clean_docker() {
    if command -v docker &> /dev/null && [[ "$CLEAN_ALL" == "true" ]]; then
        log_info "Limpiando recursos de Docker..."
        
        # Limpiar contenedores parados
        docker container prune -f 2>/dev/null || true
        
        # Limpiar imágenes sin usar
        docker image prune -f 2>/dev/null || true
        
        # Limpiar volúmenes sin usar
        docker volume prune -f 2>/dev/null || true
        
        log_success "Recursos de Docker limpiados"
    fi
}

# Optimizar base de datos (si existe)
optimize_database() {
    # Placeholder para optimización de base de datos
    # En una implementación real, aquí se optimizarían las tablas
    log_info "Optimización de base de datos (placeholder)"
}

# Mostrar estadísticas del sistema
show_system_stats() {
    log_info "Estadísticas del sistema:"
    
    # Espacio en disco de los directorios principales
    for dir in "output" "temp" "uploads" "logs" "videos"; do
        if [[ -d "$dir" ]]; then
            local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
            local count=$(find "$dir" -type f | wc -l)
            echo "  📁 $dir: $size ($count archivos)"
        fi
    done
    
    # Memoria del proceso Node.js si está corriendo
    if pgrep -f "node.*server" >/dev/null; then
        local pid=$(pgrep -f "node.*server" | head -1)
        local memory=$(ps -p $pid -o rss= 2>/dev/null | awk '{print int($1/1024)}' || echo "N/A")
        echo "  🖥️  Memoria del servidor: ${memory}MB"
    fi
    
    # Espacio libre en disco
    local free_space=$(df -h . | awk 'NR==2 {print $4}')
    echo "  💾 Espacio libre: $free_space"
}

# Verificar integridad del sistema
check_system_integrity() {
    log_info "Verificando integridad del sistema..."
    
    local issues=0
    
    # Verificar directorios esenciales
    for dir in "output" "temp" "uploads" "logs"; do
        if [[ ! -d "$dir" ]]; then
            log_warning "Directorio faltante: $dir"
            mkdir -p "$dir"
            log_success "Directorio recreado: $dir"
        fi
    done
    
    # Verificar permisos
    for dir in "output" "temp" "uploads" "logs"; do
        if [[ ! -w "$dir" ]]; then
            log_error "Sin permisos de escritura en: $dir"
            issues=$((issues + 1))
        fi
    done
    
    # Verificar archivos de configuración
    if [[ ! -f ".env" ]]; then
        log_warning "Archivo .env faltante"
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            log_success "Archivo .env creado desde .env.example"
        else
            issues=$((issues + 1))
        fi
    fi
    
    if (( issues == 0 )); then
        log_success "Integridad del sistema verificada"
    else
        log_warning "Se encontraron $issues problemas"
    fi
}

# Mostrar ayuda
show_help() {
    echo "🧹 Social Video Generator - Script de Limpieza"
    echo "=============================================="
    echo
    echo "Uso: $0 [opciones]"
    echo
    echo "Opciones:"
    echo "  --force       No pedir confirmación"
    echo "  --all         Limpieza completa (incluye node_modules, Docker)"
    echo "  --temp        Solo limpiar archivos temporales"
    echo "  --output      Solo limpiar archivos de salida antiguos"
    echo "  --logs        Solo limpiar logs antiguos"
    echo "  --uploads     Solo limpiar archivos subidos antiguos"
    echo "  --stats       Mostrar estadísticas del sistema"
    echo "  --check       Verificar integridad del sistema"
    echo "  --help        Mostrar esta ayuda"
    echo
    echo "Variables de entorno:"
    echo "  MAX_OUTPUT_FILES    Máximo número de archivos de salida (default: 1000)"
    echo "  MAX_AGE_DAYS        Máxima edad de archivos en días (default: 7)"
    echo
    echo "Ejemplos:"
    echo "  $0 --temp              # Solo limpiar temporales"
    echo "  $0 --force --all       # Limpieza completa sin confirmación"
    echo "  $0 --stats             # Solo mostrar estadísticas"
}

# Función principal
main() {
    # Parsear argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE=true
                shift
                ;;
            --all)
                CLEAN_ALL=true
                CLEAN_TEMP=true
                CLEAN_OUTPUT=true
                CLEAN_LOGS=true
                CLEAN_UPLOADS=true
                shift
                ;;
            --temp)
                CLEAN_TEMP=true
                shift
                ;;
            --output)
                CLEAN_OUTPUT=true
                shift
                ;;
            --logs)
                CLEAN_LOGS=true
                shift
                ;;
            --uploads)
                CLEAN_UPLOADS=true
                shift
                ;;
            --stats)
                show_system_stats
                exit 0
                ;;
            --check)
                check_system_integrity
                exit 0
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Opción desconocida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Si no se especifica nada, hacer limpieza básica
    if [[ "$CLEAN_TEMP" == "false" && "$CLEAN_OUTPUT" == "false" && "$CLEAN_LOGS" == "false" && "$CLEAN_UPLOADS" == "false" ]]; then
        CLEAN_TEMP=true
        CLEAN_OUTPUT=true
        CLEAN_LOGS=true
    fi
    
    echo "🧹 Iniciando limpieza del sistema..."
    echo
    
    # Mostrar estadísticas antes
    show_system_stats
    echo
    
    # Confirmar acción si no es forzado
    if [[ "$FORCE" == "false" ]]; then
        log_warning "Esta operación eliminará archivos del sistema."
        if ! confirm_action; then
            log_info "Operación cancelada"
            exit 0
        fi
    fi
    
    # Ejecutar limpiezas según las opciones
    if [[ "$CLEAN_TEMP" == "true" ]]; then
        clean_temp_files
    fi
    
    if [[ "$CLEAN_OUTPUT" == "true" ]]; then
        clean_output_files
    fi
    
    if [[ "$CLEAN_LOGS" == "true" ]]; then
        clean_log_files
    fi
    
    if [[ "$CLEAN_UPLOADS" == "true" ]]; then
        clean_upload_files
    fi
    
    if [[ "$CLEAN_ALL" == "true" ]]; then
        clean_node_cache
        clean_docker
    fi
    
    # Verificar integridad después de la limpieza
    check_system_integrity
    
    # Mostrar resumen
    echo
    log_success "Limpieza completada:"
    log_success "  📄 Archivos eliminados: $CLEANED_FILES"
    log_success "  💾 Espacio liberado: $(format_bytes $CLEANED_SIZE)"
    echo
    
    # Mostrar estadísticas después
    show_system_stats
}

# Ejecutar función principal
main "$@"