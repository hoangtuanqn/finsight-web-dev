FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 5001

# Command to run the application (in dev mode as requested for easy demo)
# Alternatively, use "npm start" for production if you have a start script
CMD ["sh", "-c", "npx prisma db push && npm run dev"]
