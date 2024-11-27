const fs = require("fs");
const https = require("https");
const express = require("express");
const WebSocket = require("ws");
const wss = require("./wss");

const app = express();

const HTTP_Port = 4000;
const webSocketPort = 8090;
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
// Пути к SSL-сертификатам
const certPath = "./path/to/cert.pem"; // Заменить на путь к твоему сертификату
const keyPath = "./path/to/key.pem"; // Заменить на путь к твоему ключу

// Чтение сертификатов
const cert = fs.readFileSync(certPath);
const key = fs.readFileSync(keyPath);

// Создание HTTPS сервера с сертификатами
const server = https.createServer({ key, cert }, app);

// Инициализация WebSocket сервера на основе HTTPS сервера
const wssServer = new WebSocket.Server({ server });

// Инициализация WebSocket серверной логики
wss.init(wssServer);

server.listen(HTTP_Port, "0.0.0.0", () => {
  console.log(`HTTPS сервер работает на https://0.0.0.0:${HTTP_Port}/`);
});
