const socket = io("http://localhost:3000");
let currentUser = null;

// --- Authentication ---
function registerUser() {
    const u = document.getElementById("username-input").value;
    const p = document.getElementById("password-input").value;
    if(!u || !p) return;
    let db = JSON.parse(localStorage.getItem("nype_db") || "{}");
    if(db[u]) return alert("Taken");
    db[u] = { password: p, pfp: `https://ui-avatars.com/api/?name=${u}&background=00aff0&color=fff`, friends: [] };
    localStorage.setItem("nype_db", JSON.stringify(db));
    alert("Registered! Sign in now.");
}

function loginUser() {
    const u = document.getElementById("username-input").value;
    const p = document.getElementById("password-input").value;
    const db = JSON.parse(localStorage.getItem("nype_db") || "{}");
    if(db[u] && db[u].password === p) {
        currentUser = u;
        document.getElementById("auth-screen").style.display = "none";
        document.getElementById("app-container").style.display = "block";
        document.getElementById("display-name").innerText = u;
        document.getElementById("my-pfp").src = db[u].pfp;
        loadContacts();
    } else { alert("Invalid"); }
}

// --- Contacts (Custom Modal) ---
function openContactModal() { document.getElementById("contact-modal").style.display = "flex"; }
function closeContactModal() { document.getElementById("contact-modal").style.display = "none"; }

function confirmAddContact() {
    const target = document.getElementById("contact-username-input").value;
    let db = JSON.parse(localStorage.getItem("nype_db"));
    if(db[target] && target !== currentUser) {
        if(!db[currentUser].friends.includes(target)) {
            db[currentUser].friends.push(target);
            localStorage.setItem("nype_db", JSON.stringify(db));
            loadContacts();
            closeContactModal();
        }
    } else { alert("User not found"); }
}

function loadContacts() {
    const list = document.getElementById("contacts-list");
    const db = JSON.parse(localStorage.getItem("nype_db"));
    list.innerHTML = "";
    db[currentUser].friends.forEach(f => {
        list.innerHTML += `<div class="contact" style="display:flex; align-items:center; padding:12px 20px;">
            <img src="${db[f].pfp}" style="width:35px; height:35px; border-radius:50%; margin-right:12px;">
            <span style="font-weight:500;">${f}</span>
        </div>`;
    });
}

// --- Messaging ---
function sendMessage() {
    const input = document.getElementById("msg-input");
    if(!input.value) return;
    socket.emit("msg", { user: currentUser, text: input.value });
    input.value = "";
}

socket.on("msg", d => {
    const chat = document.getElementById("chat");
    chat.innerHTML += `<div class="bubble"><b>${d.user}</b>${d.text}</div>`;
    chat.scrollTop = chat.scrollHeight;
});

// --- Calls & Settings ---
function startCall() { document.getElementById("call-screen").style.display = "flex"; }
function endCall() { document.getElementById("call-screen").style.display = "none"; }
function toggleSettings() { 
    const s = document.getElementById("settings-modal");
    s.style.display = s.style.display === "none" ? "flex" : "none"; 
}
function resetAllData() { if(confirm("Wipe all?")) { localStorage.clear(); location.reload(); } }