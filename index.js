const express = require("express");
const http = require("http"); // Импортируем http, а не https
const socketIo = require("socket.io");
const wss = require("./wss");

const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} request for ${req.url}`
  );
  next();
});

// Настройки Socket.io с path и CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Разрешаем все источники. Лучше настроить конкретные домены.
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"], // Разрешаем определенные заголовки
  },
});

// Инициализация WebSocket
wss.init(io);

// Обработка соединений через Socket.io
io.on("connection", (socket) => {
  const clientIp = socket.handshake.address || "null"; // IP клиента
  console.log(
    `[${new Date().toISOString()}] Клиент подключен: ${
      socket.id
    } с IP ${clientIp}`
  );

  socket.on("message", (message) => {
    console.log(
      `[${new Date().toISOString()}] Получено сообщение от ${
        socket.id
      }: ${message}`
    );
    socket.emit("response", `Принято сообщение: ${message}`);
  });

  socket.on("disconnect", () => {
    console.log(`[${new Date().toISOString()}] Клиент отключен: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(
      `[${new Date().toISOString()}] Ошибка сокета от ${socket.id}:`,
      error
    );
  });
});

// Обработка стандартного GET-запроса
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Запуск сервера на всех интерфейсах (0.0.0.0)
server.listen(8080, "127.0.0.1", () => {
  console.log(
    `[${new Date().toISOString()}] Express сервер работает на https://0.0.0.0:8080/`
  );
  console.log(
    `[${new Date().toISOString()}] Socket.io сервер работает на wss://0.0.0.0:8080/socket.io/`
  );
});
