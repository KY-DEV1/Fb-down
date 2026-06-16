# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install ffmpeg, curl, python3 (required by yt-dlp)
RUN apk add --no-cache ffmpeg curl python3

# Download yt-dlp
RUN mkdir -p /app/bin \
  && curl -sSL \
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
    -o /app/bin/yt-dlp \
  && chmod +x /app/bin/yt-dlp

# Copy built Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV NODE_ENV=production
ENV DEMO_MODE=false
ENV YTDLP_PATH=/app/bin/yt-dlp
ENV FFMPEG_PATH=ffmpeg
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
