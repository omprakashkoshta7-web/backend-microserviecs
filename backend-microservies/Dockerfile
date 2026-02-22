FROM node:18

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5000 5001 5002 5003 5004 5005 5006

CMD ["node", "gateway/server.js"]
