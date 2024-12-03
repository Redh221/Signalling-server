const express = require("express");
const http = require("http"); // Импортируем http, а не https
const socketIo = require("socket.io");
const { Server } = require("socket.io");

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
    allowedHeaders: "*", // Разрешаем определенные заголовки
    credentials: true, // Разрешить передачу cookies (если нужно)
  },
});

const channels = {};

const init = () => {
  io.on("connection", (socket) => {
    console.log("Client has been connected");
    socket.on("error", console.error);
    socket.onAny((event, ...args) => {
      console.log(
        `Event received: ${event}, with args: ${JSON.stringify(args)}`
      );
    });

    socket.on("join", (body) => {
      const { channelName, userName } = body;

      if (!channels[channelName]) {
        channels[channelName] = {};
      }
      channels[channelName][userName] = socket;
      const userNames = Object.keys(channels[channelName]);
      socket.emit("joined", userNames);
    });

    socket.on("quit", (body) => {
      const { channelName, userName } = body;

      if (channels[channelName]) {
        delete channels[channelName][userName];

        const userNames = Object.keys(channels[channelName]);
        if (userNames.length === 0) {
          delete channels[channelName];
        }
      }
    });

    socket.on("send_offer", (body) => {
      const { channelName, userName, sdp } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          const wsClient = channels[channelName][uName];
          wsClient.emit("offer_sdp_received", { sdp, from: userName });
        }
      });
    });

    socket.on("send_answer", (body) => {
      const { channelName, userName, sdp } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          const wsClient = channels[channelName][uName];
          wsClient.emit("answer_sdp_received", { sdp, from: userName });
        }
      });
    });

    socket.on("send_ice_candidate", (body) => {
      const { channelName, userName, candidate } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          const wsClient = channels[channelName][uName];
          wsClient.emit("ice_candidate_received", {
            candidate,
            from: userName,
          });
        }
      });
    });

    socket.on("disconnect", () => {
      Object.keys(channels).forEach((channelName) => {
        Object.keys(channels[channelName]).forEach((userName) => {
          if (channels[channelName][userName] === socket) {
            delete channels[channelName][userName];
          }
        });

        if (Object.keys(channels[channelName]).length === 0) {
          delete channels[channelName];
        }
      });
    });
  });
};

// Инициализация WebSocket
init();

// Обработка стандартного GET-запроса
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Запуск сервера на всех интерфейсах (0.0.0.0)
server.listen(8080, () => {
  console.log(
    `[${new Date().toISOString()}] Express сервер работает на http://0.0.0.0:8080/`
  );
  console.log(
    `[${new Date().toISOString()}] Socket.io сервер работает на ws://0.0.0.0:8080/socket.io/`
  );
});
