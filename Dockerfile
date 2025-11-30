FROM nginx:alpine

# Copy static files
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

# Copy nginx configuration (NPM will handle SSL/domain routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (NPM will handle SSL termination)
EXPOSE 80

