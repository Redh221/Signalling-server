const WebSocket = require("ws");

const init = (port) => {
  console.log("WebSocket server init");
  const wss = new WebSocket.Server({ port });

  wss.on("connection", (socket) => {
    console.log("Client has been connected");
    socket.on("error", console.error);
    socket.on("message", (message) => onMessage(wss, socket, message));
    socket.on("close", (message) => onClose(wss, socket, message));
  });
};

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
      console.log("offer_received");
      const { sdp } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          // Send offer to all other users in the channel
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
          // Send answer to the user who sent the offer
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
          // Forward the ICE candidate to all other users
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

    // Remove channel if empty
    if (Object.keys(channels[channelName]).length === 0) {
      delete channels[channelName];
    }
  });
};

module.exports = { init };
