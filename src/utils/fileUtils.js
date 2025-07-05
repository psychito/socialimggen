// ecosystem.config.js - Configuración de PM2 para producción
module.exports = {
    apps: [{
            name: 'social-video-generator',
            script: './dist/server.js',
            instances: 'max', // Utilizar todos los núcleos de CPU disponibles
            exec_mode: 'cluster',
            // Variables de entorno
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 3001
            },
            // Configuración de logs
            log_file: './logs/pm2-combined.log',
            out_file: './logs/pm2-out.log',
            error_file: './logs/pm2-error.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            // Configuración de memoria y rendimiento
            max_memory_restart: '1G',
            node_args: '--max-old-space-size=2048',
            // Configuración de reinicio automático
            watch: false, // No usar en producción
            ignore_watch: ['node_modules', 'logs', 'temp', 'output', 'uploads'],
            watch_options: {
                followSymlinks: false
            },
            // Configuración de reinicio por excepciones
            min_uptime: '10s',
            max_restarts: 10,
            autorestart: true,
            // Configuración de cluster
            kill_timeout: 5000,
            listen_timeout: 3000,
            // Configuración de merge logs
            merge_logs: true,
            // Configuración de cron para tareas programadas
            cron_restart: '0 2 * * *', // Reiniciar diariamente a las 2 AM
            // Variables de entorno específicas
            env_vars: {
                FORCE_COLOR: 1
            },
            // Configuración de source map
            source_map_support: true,
            // Configuración de graceful shutdown
            shutdown_with_message: true,
            wait_ready: true,
            listen_timeout: 10000,
            kill_timeout: 5000
        }],
    // Configuración de deploy (opcional)
    deploy: {
        production: {
            user: 'deploy',
            host: ['your-server.com'],
            ref: 'origin/main',
            repo: 'https://github.com/psychito/socialimggen.git',
            path: '/var/www/social-video-generator',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
            'ssh_options': 'ForwardAgent=yes'
        },
        staging: {
            user: 'deploy',
            host: ['staging-server.com'],
            ref: 'origin/develop',
            repo: 'https://github.com/psychito/socialimggen.git',
            path: '/var/www/social-video-generator-staging',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
        }
    }
};
