const express = require("express");
const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");
const wss = require("./wss");

const app = express();

const HTTP_Port = 4000; // HTTP сервер на 4000 порту
const webSocketPort = 8090; // WebSocket сервер на 8090 порту

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

// Настроим WebSocket сервер через HTTPS (SSL)
const wssServer = new WebSocket.Server({ server, path: "/ws" });

// Инициализация WebSocket
wss.init(wssServer);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Запуск HTTP сервера на порту 4000
server.listen(HTTP_Port, () => {
  console.log(`Express сервер работает на https://localhost:${HTTP_Port}/`);
  console.log("WebSocket сервер работает на https://localhost:8090/ws/");
});

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
