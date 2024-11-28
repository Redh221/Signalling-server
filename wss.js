const channels = {};

const init = (io) => {
  io.on("connection", (socket) => {
    console.log("Client has been connected");
    socket.on("error", console.error);

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

module.exports = { init };
