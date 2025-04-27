FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Install the Firefly MCP package globally
# This prevents npx from downloading it on each run
RUN npm install -g @fireflyai/firefly-mcp

# Expose the port the application will run on
EXPOSE 6001

# Command to run the installed application
CMD ["firefly-mcp", "--hosting", "--port", "6001"] 
