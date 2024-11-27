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

// Логирование подключений
wssServer.on("connection", (ws, req) => {
  const clientIp = req.connection.remoteAddress;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] WebSocket подключение от ${clientIp}`);

  // Пример отправки сообщения клиенту при подключении
  ws.send("Вы подключены к WebSocket серверу");

  // Логируем каждое сообщение от клиента
  ws.on("message", (message) => {
    console.log(`[${timestamp}] Получено сообщение от ${clientIp}: ${message}`);
  });

  // Логируем закрытие соединения
  ws.on("close", () => {
    console.log(`[${timestamp}] Соединение с ${clientIp} закрыто`);
  });

  // Логируем ошибки
  ws.on("error", (error) => {
    console.error(`[${timestamp}] Ошибка с WebSocket от ${clientIp}:`, error);
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
  console.error("WebSocket error:", error);
});

// Важно: для WebSocket серверов через upgrade, нужно обработать событие upgrade
server.on("upgrade", (request, socket, head) => {
  // Обработка подключения WebSocket через HTTP сервер
  wssServer.handleUpgrade(request, socket, head, (ws) => {
    wssServer.emit("connection", ws, request);
  });
});
