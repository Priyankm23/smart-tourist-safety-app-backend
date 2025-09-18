FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --silent

# Copy app source
COPY . .

# Add entrypoint which can copy an env file from a mounted path or Docker secret
COPY docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# Set environment and expose port
ENV NODE_ENV=production
EXPOSE 3000

# Use entrypoint so an env file can be provided at runtime
ENTRYPOINT ["sh", "/usr/src/app/docker-entrypoint.sh"]
CMD ["node", "app.js"]
