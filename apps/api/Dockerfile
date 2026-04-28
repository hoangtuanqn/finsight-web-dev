FROM oven/bun:1-alpine

WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies using Bun
RUN bun install

# Move to the app directory
WORKDIR /app/apps/api

# Generate Prisma client
RUN bunx prisma generate

# Expose the API port
EXPOSE 5001

# Command to run the application
CMD ["sh", "-c", "bunx prisma db push && bun run dev"]
