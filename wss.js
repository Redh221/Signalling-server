const channels = {};

const send = (wsClient, type, body) => {
  wsClient.send(JSON.stringify({ type, body }));
};

const onMessage = (wss, socket, message) => {
  const parsedMessage = JSON.parse(message);
  const { type, body } = parsedMessage;
  const { channelName, userName } = body;

  switch (type) {
    case "join": {
      if (!channels[channelName]) {
        channels[channelName] = {};
      }
      channels[channelName][userName] = socket;
      const userNames = Object.keys(channels[channelName]);
      send(socket, "joined", userNames);
      break;
    }
    case "quit": {
      if (channels[channelName]) {
        delete channels[channelName][userName];

        const userNames = Object.keys(channels[channelName]);
        if (userNames.length === 0) {
          delete channels[channelName];
        }
      }
      break;
    }
    case "send_offer": {
      const { sdp } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          const wsClient = channels[channelName][uName];
          send(wsClient, "offer_sdp_received", { sdp, from: userName });
        }
      });
      break;
    }
    case "send_answer": {
      const { sdp } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          const wsClient = channels[channelName][uName];
          send(wsClient, "answer_sdp_received", { sdp, from: userName });
        }
      });
      break;
    }
    case "send_ice_candidate": {
      const { candidate } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          const wsClient = channels[channelName][uName];
          send(wsClient, "ice_candidate_received", {
            candidate,
            from: userName,
          });
        }
      });
      break;
    }
    default:
      console.warn(`Unhandled message type: ${type}`);
  }
};

const onClose = (wss, socket, message) => {
  console.log("onClose", message);
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
};

const init = (wssServer) => {
  wssServer.on("connection", (socket) => {
    console.log("Client has been connected");
    socket.on("error", console.error);
    socket.on("message", (message) => onMessage(wssServer, socket, message));
    socket.on("close", (message) => onClose(wssServer, socket, message));
  });
};

module.exports = { init };
