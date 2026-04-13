FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Run Vite with --host so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
