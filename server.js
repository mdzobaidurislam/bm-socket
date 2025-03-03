const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow non-browser requests
        return callback(null, true); // Allow all domains
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let onlineUsers = new Map();

io.on("connection", (socket) => {
    socket.on("userOnline", (userId) => {
        onlineUsers.set(userId, socket.id);
    });
    // Handle user disconnect
    socket.on("disconnect", () => {
        const userId = [...onlineUsers.entries()].find(([_, id]) => id === socket.id)?.[0];
        if (userId) {
            onlineUsers.delete(userId);
            console.log(`User ${userId} disconnected`);
        }
    });
});

app.use(express.json());
app.post("/", (req, res) => {
    res.status(200).json({ message: "Welcome server" });
});


app.post("/order-placed", (req, res) => {
    const { user_id} = req.body;
    const userIdNumber =Number(user_id);
    if (onlineUsers.has(userIdNumber)) {
        onlineUsers.forEach((socket, userId) => {
            if (userId !== userIdNumber) {
                io.to(socket).emit("newOrder", {
                    status:true,
                    ...req.body,
                });
            }
        });
    } else {
        io.emit("newOrder", {
            status:false,
            ...req.body,
        });
    }
    res.status(200).json({ message: "Order notification sent (if user is online)" });
});

server.listen(3000, () => {
    console.log("Socket.io Server running on port 3000");
});
