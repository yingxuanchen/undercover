import express from "express";
import { createServer } from "http";
import { connectDB } from "./util/db.js";
import { initIO } from "./util/socket.js";
import connectMongoDBSession from "connect-mongodb-session";
import compression from "compression";
import session from "express-session";
import gameRoutes from "./routes/game.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export const allowedOrigins = [
  "http://localhost:5173",
  "https://yingxuanchen.github.io",
  "https://undercover-gwsk.onrender.com",
];

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

const oneDay = 24 * 60 * 60 * 1000;

const MongoDBStore = connectMongoDBSession(session);

const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
  expires: oneDay,
});

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(
  session({
    secret: "undercover",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { httpOnly: true, maxAge: oneDay, secure: isProduction, sameSite: isProduction ? "none" : "lax" },
  })
);

app.use("/api", gameRoutes);

if (isProduction) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  app.use(express.static(path.join(__dirname, "public")));

  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
}

await connectDB();

const io = initIO(httpServer);
io.on("connection", (socket) => {
  console.log("socket.io client connected: " + socket.id);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
