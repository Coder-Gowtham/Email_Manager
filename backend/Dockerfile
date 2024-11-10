# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port (e.g., 5000 if your backend runs on that port)
EXPOSE 5000

# Start the backend
CMD ["npm", "start"]
