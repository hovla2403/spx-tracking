# Dockerfile
FROM ghcr.io/puppeteer/puppeteer:23.0.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production --no-audit --no-fund

# Copy application code
COPY . .

# ✅ Set environment variables to reduce memory usage
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_BIN=/usr/bin/google-chrome-stable
ENV NODE_OPTIONS="--max-old-space-size=512"

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
