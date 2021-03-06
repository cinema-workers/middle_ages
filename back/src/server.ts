import path from "path";

import express, { Application } from "express";

import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import multer from "multer";
import { ioInstance } from "./socket";

import films from "./routes/film";
import { sequelize } from "./util/database";
import { Film } from "./models/film";
import { PaymentStatus } from "./models/payment-status";
import { Ticket } from "./models/ticket";
import { Session } from "./models/session";
import { Order } from "./models/order";
import { User } from "./models/user";
import RefreshToken from "./models/refresh_token";
import { ResetToken } from "./models/reset_token";
import { Genre } from "./models/genre";
import { Discount } from "./models/discount";
import adminRouter from "./routes/admin";
import homeRouter from "./routes/home";
import authRouter from "./routes/auth";
import orderRouter from "./routes/order";
import { Seat } from "./models/seat";
import { FilmGenres } from "./models/film_genres";

const app: Application = express();
const port = 3000;
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../front/src/images");
  },
  filename: (req, file, cb) => {
    cb(null, Number(new Date()) + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/svg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(bodyParser.json());
app.use(cookieParser());
app.use(multer({ storage: fileStorage, fileFilter }).single("posterUrl"));
app.use("/images", express.static(path.join(__dirname, "../front/src/images")));

app.use(cors({ origin: "http://localhost:8080" }));
app.use(adminRouter);
app.use(homeRouter);
app.use("/order", orderRouter);
app.use("/films", films);
app.use("/auth", authRouter);
app.use("/", films);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const { message } = error;
  const { data } = error;
  console.log(error, "error handler");

  res.status(status).json({ message: message, data: data });
});

User.hasMany(Order, { constraints: true, onDelete: "CASCADE" });
User.hasOne(RefreshToken);
User.hasOne(ResetToken);
Discount.hasMany(Order);
PaymentStatus.hasMany(Order);
Session.belongsToMany(Order, { through: Seat });
Session.hasMany(Seat);
Order.hasMany(Seat);
Order.hasMany(Ticket);
Genre.belongsToMany(Film, { through: FilmGenres });
Film.hasMany(Session, { constraints: true, onDelete: "CASCADE" });
Seat.hasOne(Ticket, { constraints: true, onDelete: "CASCADE" });

async function startServer() {
  try {
    await sequelize.sync();
    const server = app.listen(port);
    // const io = ioInstance.init(server);
    // io.on("connection", (socket) => {
    //   console.log("a user connected");
    //   socket.on("disconnect", () => {
    //     console.log("user disconnected");
    //   });
    //   socket.on("my message", (msg: string) => {
    //     console.log("message: " + msg);
    //     io.emit("my broadcast", `server: ${msg}`);
    //   });
    // });
  } catch (e) {
    console.log(e);
  }
}

startServer();
