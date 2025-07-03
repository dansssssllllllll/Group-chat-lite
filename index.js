
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let users = {};        // socket.id -> { username, isAdmin }
let messages = [];     // chat history
let bannedUsers = new Set(); // banned usernames

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    socket.on("login", (name) => {
        const username = name.trim();
        if (!username || bannedUsers.has(username)) {
            socket.emit("chat message", { user: "Server", message: "You are banned or username invalid." });
            return;
        }
        users[socket.id] = { username, isAdmin: false };
        socket.emit("chat history", messages);
        io.emit("user list", Object.values(users).map(u => u.username));
        io.emit("chat message", { user: "Server", message: username + " joined the chat." });
    });

    socket.on("chat message", (msg) => {
        const user = users[socket.id];
        if (!user) return;

        if (msg.startsWith("/")) {
            const args = msg.split(" ");
            const command = args[0].toLowerCase();

            if (command === "/redeem" && args[1] === "ADMINPOWER123") {
                users[socket.id].isAdmin = true;
                socket.emit("chat message", { user: "Server", message: "You are now an admin!" });
            } else if (!user.isAdmin) {
                socket.emit("chat message", { user: "Server", message: "No permission." });
            } else {
                switch (command) {
                    case "/ban":
                        const toBan = args[1];
                        if (toBan) {
                            bannedUsers.add(toBan);
                            for (let id in users) {
                                if (users[id].username === toBan) {
                                    io.to(id).emit("chat message", { user: "Server", message: "You have been banned." });
                                    io.to(id).disconnectSockets(true);
                                }
                            }
                            io.emit("chat message", { user: "Server", message: `${toBan} has been banned.` });
                        }
                        break;
                    case "/unban":
                        const toUnban = args[1];
                        if (toUnban) {
                            bannedUsers.delete(toUnban);
                            socket.emit("chat message", { user: "Server", message: `${toUnban} has been unbanned.` });
                        }
                        break;
                    case "/userlist":
                        const list = Object.values(users).map(u => u.username).join(", ");
                        socket.emit("chat message", { user: "Server", message: "Users: " + list });
                        break;
                    case "/announce":
                        const announcement = args.slice(1).join(" ");
                        if (announcement) {
                            io.emit("notification", { message: announcement });
                            io.emit("chat message", { user: "Server", message: "Announcement sent." });
                        }
                        break;
                    case "/warn":
                        const warnUser = args[1];
                        const warnMsg = args.slice(2).join(" ");
                        for (let id in users) {
                            if (users[id].username === warnUser) {
                                io.to(id).emit("notification", { message: "Warning: " + warnMsg });
                                socket.emit("chat message", { user: "Server", message: `Warning sent to ${warnUser}.` });
                            }
                        }
                        break;
                    case "/help":
                        const helpText = [
                            "/ban <username>",
                            "/unban <username>",
                            "/userlist",
                            "/announce <message>",
                            "/warn <username> <message>",
                            "/pm <username> <message>",
                            "/help"
                        ].join("\n");
                        socket.emit("chat message", { user: "Server", message: helpText });
                        break;
                    default:
                        socket.emit("chat message", { user: "Server", message: "Unknown command." });
                }
            }
        } else {
            const message = { user: user.username, message: msg };
            messages.push(message);
            io.emit("chat message", message);
        }
    });

    socket.on("disconnect", () => {
        if (users[socket.id]) {
            io.emit("chat message", { user: "Server", message: `${users[socket.id].username} left the chat.` });
            delete users[socket.id];
            io.emit("user list", Object.values(users).map(u => u.username));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));
