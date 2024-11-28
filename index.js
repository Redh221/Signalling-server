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

const io = new Server(server, {
  path: "/ws",
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
});

wss.init(io);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

server.listen(HTTP_Port, () => {
  console.log(`Express сервер работает на https://localhost:${HTTP_Port}/`);
  console.log("Socket.io сервер работает на wss://localhost:4000/ws/");
});
