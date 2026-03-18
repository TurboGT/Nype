
const socket = io("https://nype.onrender.com"); 

let currentUser = null;
let selectedContact = null;

socket.on('connect', () => {
    console.log("Successfully connected to Render!");
    // You could hide a loading spinner here
});

socket.on('connect_error', () => {
    console.log("Attempting to wake up the server... please wait.");
});

// --- Authentication (Server-Side) ---

function registerUser() {
    const uInput = document.getElementById("username-input").value.trim().toLowerCase();
    const pInput = document.getElementById("password-input").value;

    if (!uInput || !pInput) return alert("Fill in all fields.");

    // Tell the server to save this user
    socket.emit('register', { username: uInput, password: pInput }, (res) => {
        if (res.success) {
            alert("Registered! You can now Sign In.");
        } else {
            alert(res.message || "Registration failed.");
        }
    });
}

function loginUser() {
    const uInput = document.getElementById("username-input").value.trim().toLowerCase();
    const pInput = document.getElementById("password-input").value;

    socket.emit('login', { username: uInput, password: pInput }, (res) => {
        if (res.success) {
            currentUser = uInput;
            
            // UI Transitions
            document.getElementById("auth-screen").style.display = "none";
            document.getElementById("app-container").style.display = "block";
            
            // Set Profile Info
            document.getElementById("display-name").innerText = uInput;
            document.getElementById("my-pfp").src = res.user.pfp;
            
            // Load the friends list returned by the server
            renderContacts(res.user.friends);
        } else {
            alert("Invalid login. Make sure you registered on this server!");
        }
    });
}

// --- Contacts Management ---

function openContactModal() {
    const modal = document.getElementById("contact-modal");
    modal.style.display = "flex";
    document.getElementById("contact-username-input").focus();
}

function closeContactModal() {
    document.getElementById("contact-modal").style.display = "none";
    document.getElementById("contact-username-input").value = "";
}

function confirmAddContact() {
    const targetInput = document.getElementById("contact-username-input");
    const target = targetInput.value.trim().toLowerCase();

    if (!target || target === currentUser) return;

    // Ask server to link these two accounts
    socket.emit('add-contact', { me: currentUser, target: target }, (res) => {
        if (res.success) {
            renderContacts(res.friends);
            closeContactModal();
        } else {
            alert("User not found on the server database.");
        }
    });
}

function renderContacts(friendsList) {
    const list = document.getElementById("contacts-list");
    list.innerHTML = "";

    friendsList.forEach(friendName => {
        const div = document.createElement("div");
        div.className = "contact";
        div.onclick = () => selectContact(friendName, div);

        div.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=${friendName}&background=00aff0&color=fff" style="width:35px; height:35px; border-radius:50%; margin-right:12px;">
            <span style="font-weight:500;">${friendName}</span>
        `;
        list.appendChild(div);
    });
}

function selectContact(name, element) {
    selectedContact = name;

    document.getElementById("no-chat-selected").style.display = "none";
    document.getElementById("main").style.display = "flex";
    document.getElementById("active-contact-name").innerText = name;

    document.querySelectorAll('.contact').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');

    document.getElementById("chat").innerHTML = "";
}

// --- Messaging ---

function sendMessage() {
    const input = document.getElementById("msg-input");
    const messageText = input.value.trim();

    if (!messageText || !selectedContact) return;

    // Send to server (Server relays this to everyone)
    socket.emit("msg", { 
        from: currentUser, 
        to: selectedContact, 
        text: messageText 
    });

    input.value = "";
}

socket.on("msg", (data) => {
    // Only show messages if they are for the current chat session
    const chat = document.getElementById("chat");
    const isMe = data.from === currentUser;
    
    chat.innerHTML += `
        <div class="bubble" style="${isMe ? 'align-self: flex-end; background: #e1f5fe;' : 'align-self: flex-start;'}">
            <b style="font-size: 10px; color: #888;">${data.from}</b><br>
            ${data.text}
        </div>`;
    
    chat.scrollTop = chat.scrollHeight;
});

// --- App Controls ---

function startCall() {
    const callScreen = document.getElementById("call-screen");
    if (callScreen) {
        callScreen.style.display = "flex";
    }
}

function endCall() {
    const callScreen = document.getElementById("call-screen");
    if (callScreen) {
        callScreen.style.display = "none";
    }
}

function toggleSettings() { 
    const s = document.getElementById("settings-modal");
    s.style.display = (s.style.display === "none" || s.style.display === "") ? "flex" : "none"; 
}

function resetAllData() {
    if (confirm("This will clear your local session. The server data will remain.")) {
        location.reload();
    }
}

// Enter Key Support
document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const modal = document.getElementById("contact-modal");
        if (modal.style.display === "flex") {
            confirmAddContact();
        } else if (selectedContact) {
            sendMessage();
        }
    }
});
