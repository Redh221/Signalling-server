const express = require("express");
const WebSocket = require("ws");
const wss = require("./wss");

const app = express();

const HTTP_Port = 4000;
const webSocketPort = 8090;
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const wssServer = new WebSocket.Server({ noServer: true });

wss.init(wssServer);

// В HTTP режиме не нужно устанавливать сертификаты, просто запускаем сервер
const server = app.listen(HTTP_Port, () => {
  console.log(`Express сервер работает на http://localhost:${HTTP_Port}/`);
});

server.on("upgrade", (request, socket, head) => {
  wssServer.handleUpgrade(request, socket, head, (ws) => {
    wssServer.emit("connection", ws, request);
  });
});
