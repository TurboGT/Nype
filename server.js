const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const mongoose = require('mongoose');

// 1. Connection (Replace <password> and YOUR_URL with your Atlas info)
const MONGO_URI = "mongodb+srv://Naterino:<RBLX1211>@nype-server.8vvhdof.mongodb.net/?appName=Nype-Server";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ Mongo Error:", err));

// 2. Define the User Schema
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, lowercase: true },
    password: { type: String, required: true },
    pfp: String,
    friends: [String]
}));

io.on('connection', (socket) => {
    // Register Logic
    socket.on('register', async (data, callback) => {
        try {
            const u = data.username.toLowerCase();
            const newUser = new User({
                username: u,
                password: data.password,
                pfp: `https://ui-avatars.com/api/?name=${u}&background=00aff0&color=fff`,
                friends: []
            });
            await newUser.save();
            callback({ success: true });
        } catch (e) { callback({ success: false, message: "User exists!" }); }
    });

    // Login Logic
    socket.on('login', async (data, callback) => {
        const user = await User.findOne({ username: data.username.toLowerCase(), password: data.password });
        if (user) callback({ success: true, user });
        else callback({ success: false });
    });

    // Add Contact Logic
    socket.on('add-contact', async (data, callback) => {
        const target = data.target.toLowerCase();
        const exists = await User.findOne({ username: target });
        if (exists) {
            await User.findOneAndUpdate({ username: data.me.toLowerCase() }, { $addToSet: { friends: target } });
            const me = await User.findOne({ username: data.me.toLowerCase() });
            callback({ success: true, friends: me.friends });
        } else { callback({ success: false }); }
    });

    socket.on('msg', (data) => io.emit('msg', data));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server live on ${PORT}`));
