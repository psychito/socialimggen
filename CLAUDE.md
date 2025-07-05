# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Node.js + TypeScript)
- `npm run dev` - Start development server with ts-node (PORT 3000)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server from dist/
- `npm test` - Basic health check test (curl localhost:3000/health)

### Frontend (React + Vite)
- `cd client && npm run dev` - Start Vite development server (PORT 5173)
- `cd client && npm run build` - Build for production
- `cd client && npm run lint` - Run ESLint
- `cd client && npm run type-check` - TypeScript type checking

### Development Workflow
**IMPORTANT**: For development, you need both servers running:
1. **Terminal 1**: `npm run dev` (Backend server on port 3000)
2. **Terminal 2**: `cd client && npm run dev` (Frontend server on port 5173)

The frontend is configured to proxy API requests to the backend server.

### Process Management
- `npm run pm2:start` - Start with PM2 in production
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process
- `npm run pm2:logs` - View PM2 logs

### Docker
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Start with docker-compose
- `npm run docker:stop` - Stop docker-compose

### Setup & Cleanup
- `npm run setup` - Run initial setup script
- `npm run cleanup` - Clean temporary files

## Architecture Overview

This is a full-stack social media video/image generator that creates Twitter-like posts with glassmorphism effects over dynamic video backgrounds.

### Backend Structure
- **Server**: Express.js with TypeScript, comprehensive logging with Winston
- **API Routes**: 
  - `/api/video` - Video generation endpoints
  - `/api/image` - Image generation endpoints  
  - `/api/upload` - File upload handling
- **Services**: 
  - `videoGenerator.ts` - Core video generation logic
  - `imageGenerator.ts` - Image generation with Canvas
  - `backgroundSelector.ts` - Background video selection
- **Utils**: 
  - `canvas.ts` - Canvas rendering utilities
  - `ffmpeg.ts` - Video processing with FFmpeg
  - `fileUtils.ts` - File system operations

### Frontend Structure
- **React + TypeScript + Vite**: Modern frontend stack
- **Tailwind CSS**: Utility-first styling
- **Main Component**: `VideoGenerator.tsx` - handles form inputs and API calls
- **Features**: Video/image generation toggle, aspect ratio selection, avatar/background selection

### Key Technologies
- **Video Processing**: FFmpeg with fluent-ffmpeg wrapper
- **Canvas Rendering**: node-canvas for overlay generation
- **Background Videos**: Categorized B-roll videos (tech, nature, urban, abstract, business)
- **Glassmorphism**: CSS-based blur effects with transparency
- **Rate Limiting**: rate-limiter-flexible for API protection
- **File Handling**: Multer for uploads, UUID for unique filenames

### Data Flow
1. Frontend collects tweet data and options
2. Backend selects appropriate background video
3. Canvas generates glassmorphism overlay with tweet content
4. FFmpeg combines background video with overlay
5. Generated file served from `/output` directory

### File Structure
- `/src/types/` - Comprehensive TypeScript definitions
- `/videos/` - Background video assets organized by category
- `/output/` - Generated videos/images (auto-cleanup)
- `/temp/` - Temporary processing files
- `/uploads/` - User-uploaded assets
- `/logs/` - Application logs (Winston)

### Configuration
- TypeScript path aliases: `@/` for src/, `@/types/`, `@/utils/`, `@/services/`
- Environment variables in `.env` (see `.env.example`)
- PM2 configuration in `ecosystem.config.js`
- Docker setup with multi-stage build

### Quality & Performance
- Input validation with custom type guards
- Comprehensive error handling and logging
- Memory management with file cleanup
- Hardware acceleration support for video processing
- Configurable quality presets (low/medium/high/ultra)

## Important Notes

- The application expects FFmpeg to be installed on the system
- Background videos are stored locally in categorized folders
- Generated files are automatically cleaned up based on configuration
- Rate limiting is enforced to prevent abuse
- All video processing is done server-side for security