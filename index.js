const express = require("express");
const WebSocket = require("ws");
const wss = require("./wss");

const app = express();

const HTTP_Port = 4000; // HTTP сервер на 4000 порту
const webSocketPort = 8090; // WebSocket сервер на 8090 порту

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Настроим WebSocket сервер на порту 8090
const wssServer = new WebSocket.Server({ port: webSocketPort });

// Инициализация WebSocket
wss.init(wssServer);

// Запуск HTTP сервера на порту 4000
const server = app.listen(HTTP_Port, () => {
  console.log(`Express сервер работает на http://localhost:${HTTP_Port}/`);
});

// Важно: для WebSocket серверов через upgrade, нужно обработать событие upgrade
server.on("upgrade", (request, socket, head) => {
  // Обработка подключения WebSocket через HTTP сервер
  wssServer.handleUpgrade(request, socket, head, (ws) => {
    wssServer.emit("connection", ws, request);
  });
});
