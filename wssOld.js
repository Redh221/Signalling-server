const WebSocket = require("ws");
const init = (port) => {
  console.log("WebSocket server init");
  const wss = new WebSocket.Server({ port });

  // testing second device

  wss.on("connection", (socket) => {
    console.log("Client has been connected");
    // remove it later
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
  // type is string
  //body is object which able to containts anything we put in
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
        channels[channelName][userName] = null;

        const userNames = Object.keys(channels[channelName]);
        if (!userNames.length) {
          delete channels[channelName];
        }
      }
      break;
    }
    case "send_offer": {
      console.log("offfer_received");
      const { sdp } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          //check for everyone except us
          const wsClient = channels[channelName][uName];
          send(wsClient, "offer_sdp_received", sdp);
        }
      });
      break;
    }
    case "send_answer": {
      const { sdp } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          //check for everyone except us
          const wsClient = channels[channelName][uName];
          send(wsClient, "answer_sdp_received", sdp);
          //here, in return to others sdp's sharing them their sdp's
        }
      });
      break;
    }
    case "send_ice_candidate": {
      const { candidate } = body;
      const userNames = Object.keys(channels[channelName]);
      userNames.forEach((uName) => {
        if (uName !== userName) {
          //check for everyone except us
          const wsClient = channels[channelName][uName];
          send(wsClient, "ice_candidate_received", candidate);
          //here, p2p information is sent to clients, so they are able to connect to each other by themselves
        }
      });
      break;
    }
  }
};
const onClose = (wss, socket, message) => {
  console.log("onClose", message);
  Object.keys(channels).forEach((channel) => {
    Object.keys(channels[channel]).forEach((user) => {
      if (channels[channel][user] === socket) {
        delete channels[channel][user];
      }
    });
  });
};
module.exports = { init };
