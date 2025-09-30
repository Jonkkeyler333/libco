FROM node:20

WORKDIR /app
COPY frontend/package*.json ./

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY frontend /app
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]