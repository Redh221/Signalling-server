const express = require("express");
const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");
const wss = require("./wss");

const app = express();

const HTTP_Port = 4000; // Сервер на порту 4000

// Загрузка SSL сертификатов для HTTPS
const options = {
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/signal-server.waterhedgehog.com/fullchain.pem"
  ),
  key: fs.readFileSync(
    "/etc/letsencrypt/live/signal-server.waterhedgehog.com/privkey.pem"
  ),
};

// Создаем HTTPS сервер
const server = https.createServer(options, app);

// Настроим WebSocket сервер через HTTPS (WSS)
const wssServer = new WebSocket.Server({
  server, // Указываем, что WebSocket сервер будет использовать тот же сервер
  path: "/ws", // Путь для WebSocket
});

// Инициализация WebSocket
wss.init(wssServer);

// Логирование подключения клиента
wssServer.on("connection", (ws, req) => {
  console.log(
    `[${new Date().toISOString()}] WebSocket подключение от ${
      req.connection.remoteAddress
    }`
  );

  ws.on("message", (message) => {
    console.log(`Получено сообщение: ${message}`);
  });

  ws.on("close", () => {
    console.log(`Подключение закрыто: ${req.connection.remoteAddress}`);
  });

  ws.on("error", (error) => {
    console.error("Ошибка WebSocket:", error);
  });
});

app.get("/", (req, res) => {
  res.send("Hello, World!"); // Ваш основной роут
});

// Запуск HTTPS сервера
server.listen(HTTP_Port, () => {
  console.log(`Express сервер работает на https://localhost:${HTTP_Port}/`);
  console.log("WebSocket сервер работает на wss://localhost:4000/ws/");
});

// Обработка ошибок на WebSocket сервере
wssServer.on("error", (error) => {
  console.error("Ошибка WebSocket сервера:", error);
});
