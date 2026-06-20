# 1. Use the official Playwright base image with system dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.61.0-noble

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first to leverage Docker caching layers
COPY package*.json ./

# 4. Install clean dependencies (including Playwright npm package)
RUN npm ci

# 5. Copy the rest of your application code
COPY . .

# 6. Command to execute tests when the container starts
CMD ["npx", "playwright", "test"]