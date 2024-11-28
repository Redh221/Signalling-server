const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const wss = require("./wss");

const app = express();
const HTTP_Port = 4000;

const options = {
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/signal-server.waterhedgehog.com/fullchain.pem"
  ),
  key: fs.readFileSync(
    "/etc/letsencrypt/live/signal-server.waterhedgehog.com/privkey.pem"
  ),
};

const server = https.createServer(options, app);

// Настройки Socket.io с path и CORS
const io = new Server(server, {
  path: "/ws", // Путь для WebSocket соединений
  cors: {
    origin: '*', // Разрешаем все источники. Лучше настроить конкретные домены.
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"], // Разрешаем определенные заголовки
  },
});

// Инициализация WebSocket
wss.init(io);

// Обработка соединений через Socket.io
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Клиент подключен: ${socket.id} с IP ${socket.handshake.address}`);

  // Получение сообщений от клиента
  socket.on('message', (message) => {
    console.log(`Получено сообщение от ${socket.id}: ${message}`);
    // Можно отправить ответ клиенту
    socket.emit('response', `Принято сообщение: ${message}`);
  });

  // Обработка отключений
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Клиент отключен: ${socket.id}`);
  });

  // Обработка ошибок сокета
  socket.on('error', (error) => {
    console.error(`Ошибка сокета от ${socket.id}:`, error);
  });
});

// Обработка стандартного GET-запроса
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Запуск сервера
server.listen(HTTP_Port, () => {
  console.log(`Express сервер работает на https://localhost:${HTTP_Port}/`);
  console.log("Socket.io сервер работает на wss://localhost:4000/ws/");
});
