const socket = io("http://localhost:3000");
let currentUser = null;
let selectedContact = null;

// --- Authentication ---

function registerUser() {
    const uInput = document.getElementById("username-input").value.trim().toLowerCase();
    const pInput = document.getElementById("password-input").value;

    if (!uInput || !pInput) {
        alert("Please fill in all fields.");
        return;
    }

    let db = JSON.parse(localStorage.getItem("nype_db") || "{}");

    if (db[uInput]) {
        alert("Username already exists!");
        return;
    }

    // Save user with a default UI Avatar
    db[uInput] = { 
        password: pInput, 
        pfp: `https://ui-avatars.com/api/?name=${uInput}&background=00aff0&color=fff`, 
        friends: [] 
    };

    localStorage.setItem("nype_db", JSON.stringify(db));
    alert("Registration successful! You can now Sign In.");
}

function loginUser() {
    const uInput = document.getElementById("username-input").value.trim().toLowerCase();
    const pInput = document.getElementById("password-input").value;
    const db = JSON.parse(localStorage.getItem("nype_db") || "{}");

    if (db[uInput] && db[uInput].password === pInput) {
        currentUser = uInput;
        
        // UI Transitions
        document.getElementById("auth-screen").style.display = "none";
        document.getElementById("app-container").style.display = "block";
        
        // Set Profile Info
        document.getElementById("display-name").innerText = uInput;
        document.getElementById("my-pfp").src = db[uInput].pfp;
        
        loadContacts();
    } else {
        alert("Invalid username or password.");
    }
}

// --- Contacts Management ---

function openContactModal() {
    document.getElementById("contact-modal").style.display = "flex";
    document.getElementById("contact-username-input").focus();
}

function closeContactModal() {
    document.getElementById("contact-modal").style.display = "none";
    document.getElementById("contact-username-input").value = "";
}

function confirmAddContact() {
    const target = document.getElementById("contact-username-input").value.trim().toLowerCase();
    let db = JSON.parse(localStorage.getItem("nype_db") || "{}");

    if (!target) return;

    if (target === currentUser) {
        alert("You cannot add yourself.");
        return;
    }

    if (db[target]) {
        // Ensure friends array exists
        if (!db[currentUser].friends) db[currentUser].friends = [];

        if (!db[currentUser].friends.includes(target)) {
            db[currentUser].friends.push(target);
            localStorage.setItem("nype_db", JSON.stringify(db));
            loadContacts();
            closeContactModal();
        } else {
            alert("This user is already in your contacts.");
        }
    } else {
        alert("User '" + target + "' not found. Make sure they registered!");
    }
}

function loadContacts() {
    const list = document.getElementById("contacts-list");
    const db = JSON.parse(localStorage.getItem("nype_db") || "{}");
    list.innerHTML = "";

    if (db[currentUser] && db[currentUser].friends) {
        db[currentUser].friends.forEach(friendName => {
            const friendData = db[friendName];
            const div = document.createElement("div");
            div.className = "contact";
            
            // Set active contact on click
            div.onclick = () => selectContact(friendName, div);

            div.innerHTML = `
                <img src="${friendData.pfp}" style="width:35px; height:35px; border-radius:50%; margin-right:12px; object-fit:cover;">
                <span style="font-weight:500;">${friendName}</span>
            `;
            list.appendChild(div);
        });
    }
}

function selectContact(name, element) {
    selectedContact = name;

    // Show Chat UI
    document.getElementById("no-chat-selected").style.display = "none";
    document.getElementById("main").style.display = "flex";
    
    // Update Header
    document.getElementById("active-contact-name").innerText = name;

    // Visual selection in sidebar
    document.querySelectorAll('.contact').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');

    // Reset chat view
    document.getElementById("chat").innerHTML = "";
}

// --- Messaging ---

function sendMessage() {
    const input = document.getElementById("msg-input");
    const messageText = input.value.trim();

    if (!messageText || !selectedContact) return;

    // Send to server
    socket.emit("msg", { 
        from: currentUser, 
        to: selectedContact, 
        text: messageText 
    });

    input.value = "";
}

// Global Enter Key listener for chat
document.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && selectedContact) {
        sendMessage();
    }
});

socket.on("msg", (data) => {
    const chat = document.getElementById("chat");
    const isMe = data.from === currentUser;
    
    // Simple message bubble
    chat.innerHTML += `
        <div class="bubble" style="${isMe ? 'align-self: flex-end; background: #e1f5fe;' : ''}">
            <b style="font-size: 10px; color: #888;">${data.from}</b><br>
            ${data.text}
        </div>`;
    
    chat.scrollTop = chat.scrollHeight;
});

// --- App Controls ---

function startCall() {
    document.getElementById("call-screen").style.display = "flex";
}

function endCall() {
    document.getElementById("call-screen").style.display = "none";
}

function toggleSettings() { 
    const s = document.getElementById("settings-modal");
    s.style.display = (s.style.display === "none" || s.style.display === "") ? "flex" : "none"; 
}

function resetAllData() {
    if (confirm("Are you sure you want to wipe all local data? This will delete your account and contacts.")) {
        localStorage.clear();
        location.reload();
    }
}
