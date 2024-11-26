const app = require("express")();
const wss = require("./wss");

const HTTP_Port = 4000;
const webSocketPort = 8090;

wss.init(webSocketPort);
// app.listen(HTTP_Port, "0.0.0.0", () => {
app.listen(HTTP_Port, () => {
  console.log("Server listening on port ", HTTP_Port);
});

server.listen(8090, () => {
  console.log("Secure WebSocket server running on wss://192.168.100.2:8090");
});
