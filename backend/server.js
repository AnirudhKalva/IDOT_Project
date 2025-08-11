const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 8083;
const HOST = "0.0.0.0"; // Ensure it's reachable from outside the container

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

