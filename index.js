const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const docs = require("./src/routes/docs");
const auth = require("./src/routes/auth");
const PORT = process.env.PORT || 5000;

const initServer = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(auth);
  app.use(docs);
  return app
}

const app = initServer();

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
});


io.sockets.on("connection", function (socket) {
  
  socket.on("create", function (room) {
      socket.join(room);
      console.log("Room exists with ID:");
      console.log(room);
  });

  socket.on("update", function (data) {
      socket.to(data["_id"]).emit("update", data);
      console.log("Connected to Room ==>",data["_id"]);

      console.log("DATA");
      console.log(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server is listeing on PORT ${PORT}`);
});

// app.listen(PORT, () => {
//   console.log(`Server is listeing on PORT ${PORT}`);
// });

module.exports = initServer