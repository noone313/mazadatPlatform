import express from 'express';
import { startServer } from './models/models.js';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
config();
import http from "http";
import { Server } from "socket.io";
import { userRouter } from './routes/user.route.js';
import {categoryRouter} from './routes/category.route.js'
import { auctionRouter } from './routes/auction.route.js';
import { initAuctionScheduler } from './utils/closeAuctions.js';
import { homeRouter } from './routes/home.route.js';
import path from "path";
import { fileURLToPath } from "url";



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// حتى نستخدمه في أي مكان مثل الـ scheduler
global.io = io;


// Middleware للوصول للـ io في أي مكان
app.use((req, res, next) => {
  req.io = io;
  next();
});


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// إعداد EJS كمحرك عرض
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // مجلد views



// Routes
app.use('/', userRouter);
app.use('/',categoryRouter);
app.use('/',auctionRouter);
app.use('/', homeRouter);



io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  // دخول غرفة المزاد
  socket.on("joinAuction", (auctionId) => {
    socket.join(`auction_${auctionId}`);
    console.log(`📌 User joined auction room: auction_${auctionId}`);
  });

  // دخول غرفة المستخدمuser_ (لإشعارات شخصية)
  socket.on("joinUserRoom", (userId) => {
    socket.join(`${userId}`);
    console.log(`📩 User joined personal room: user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});


startServer().then(() => {
  // شغل الجدولة بعد الاتصال بقاعدة البيانات
  initAuctionScheduler();
});

server.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});




