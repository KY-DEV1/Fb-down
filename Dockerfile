# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install ffmpeg + curl
RUN apk add --no-cache ffmpeg curl

# Create bin dir for yt-dlp
RUN mkdir -p /app/bin

# Download yt-dlp binary
RUN curl -sSL \
  "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
  -o /app/bin/yt-dlp \
  && chmod +x /app/bin/yt-dlp \
  && /app/bin/yt-dlp --version

# Copy built app from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set env
ENV NODE_ENV=production
ENV DEMO_MODE=false
ENV YTDLP_PATH=/app/bin/yt-dlp
ENV FFMPEG_PATH=ffmpeg
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
