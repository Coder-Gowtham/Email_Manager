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

# Copy the rest of the application code
COPY . .

# Expose port (e.g., 80 for serving the frontend)
EXPOSE 3000

# Command to run the frontend app
CMD ["npm", "start"]

