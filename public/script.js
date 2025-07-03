
const socket = io();
const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("userList");

loginBtn.onclick = () => {
  const username = usernameInput.value.trim();
  if (username) {
    socket.emit("login", username);
    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
  }
};

form.addEventListener("submit", function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

socket.on("chat history", (msgs) => {
  messages.innerHTML = "";
  msgs.forEach(msg => addMessage(msg));
});

socket.on("chat message", function(msg) {
  addMessage(msg);
});

socket.on("user list", (users) => {
  userList.innerHTML = "<strong>Users:</strong><br>" + users.map(u => "• " + u).join("<br>");
});

socket.on("notification", ({ message }) => {
  const note = document.createElement("div");
  note.textContent = "[NOTICE] " + message;
  note.style.background = "#ffcc00";
  note.style.color = "#000";
  note.style.padding = "10px";
  note.style.margin = "10px 0";
  note.style.borderRadius = "5px";
  messages.appendChild(note);
  messages.scrollTop = messages.scrollHeight;
});

function addMessage(msg) {
  const item = document.createElement("div");
  item.textContent = msg.user + ": " + msg.message;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}
