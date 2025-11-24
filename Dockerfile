FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY data ./data
ENV BASE_PATH=/api
ENV POLL_MINUTES=10
ENV PORT=8787
EXPOSE 8787
CMD ["node", "src/server.js"]
