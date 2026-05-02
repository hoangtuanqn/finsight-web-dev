FROM oven/bun:1-alpine

WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies using Bun
RUN bun install

# Move to the app directory
WORKDIR /app/apps/web

# Expose Vite's default dev port
EXPOSE 5173

# Run Vite with --host
CMD ["bun", "run", "dev", "--", "--host"]
