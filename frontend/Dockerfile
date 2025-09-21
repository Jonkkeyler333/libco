FROM node:18-alpine

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend /app
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]