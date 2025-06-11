import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";
import { showErrorNotification } from "../../helpers/notifications.js";
import { isBlocked, clearBlockedCache } from "../../helpers/blockedUsers.js";
import { handlePongInviteLinkClick } from "../../helpers/pongInviteHandler.js";
async function fetchCurrentUser() {
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/user/infos`, {
            credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
            return { id: data.user.id, username: data.user.username };
        }
        else {
            console.error("Failed to fetch user info:", data.message);
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
}
async function fetchChatHistory(userId) {
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/chat/history?userId=${userId}`, {
            credentials: "include"
        });
        const data = await response.json();
        if (data.success) {
            return data.messages;
        }
        else {
            console.error("Failed to fetch chat history:", data.message);
            return [];
        }
    }
    catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }
}
export async function setupChat() {
    var _a;
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendMessage");
    const chatContainer = document.getElementById("chatContainer");
    // Add container for user mention suggestions
    let mentionBox = document.getElementById("mention-suggestions");
    if (!mentionBox) {
        mentionBox = document.createElement("div");
        mentionBox.id = "mention-suggestions";
        mentionBox.className = "mention-suggestions-box";
        // Add the box to body for floating overlay
        document.body.appendChild(mentionBox);
    }
    // Check auth before displaying chat
    let currentUser = await fetchCurrentUser();
    if (!currentUser) {
        if (chatContainer)
            chatContainer.innerHTML = "<div class='chat-error'>You must be logged in to use the chat.</div>";
        if (input)
            input.style.display = 'none';
        if (sendBtn)
            sendBtn.style.display = 'none';
        return;
    }
    if (!input || !sendBtn || !chatContainer) {
        console.error("Chat elements not found in the DOM.");
        return;
    }
    // Clear the container before displaying history
    chatContainer.innerHTML = "";
    // Fetch user information
    const users = await fetchUsernames();
    const userMap = new Map(users.map(user => [user.id, user]));
    const usernames = users.map(u => u.username);
    // Group messages by author for Messenger-like display
    let lastAuthor = null;
    const addMessage = (content, authorIdRaw, self = true) => {
        let authorId = Number(authorIdRaw);
        let isSystem = false;
        let displayName = '';
        let profilePic = '';
        if (authorIdRaw === 'system' || isNaN(authorId) || authorIdRaw == 0) {
            isSystem = true;
            displayName = 'BOT';
            profilePic = '/assets/games/pong/pong.png';
        }
        else {
            const user = userMap.get(authorId);
            displayName = (user === null || user === void 0 ? void 0 : user.username) || `User#${authorId}`;
            profilePic = (user === null || user === void 0 ? void 0 : user.profile_picture) || 'default-profile.png';
        }
        const isGrouped = lastAuthor === authorId;
        // --- Special display for tournament messages (simple, trophy emoji, one message, one match per line, WITH author and photo) ---
        const bracketRegex = /^\[TOURNOI( PONG)?\] (.+?)(?:\n|: )([\s\S]+)/i;
        if (bracketRegex.test(content)) {
            const [, , phase, matchesRaw] = content.match(bracketRegex) || [];
            let matchLines = matchesRaw.split(/(?:\n|(?=Match \d+ :))/g).map(l => l.trim()).filter(Boolean);
            // Add an empty line after the time
            let msg = `🏆 ${phase}\n`;
            matchLines.forEach((line, idx) => {
                const matchMatch = line.match(/Match (\d+) ?: ?@?(\w+) ?vs ?@?(\w+)/i);
                if (matchMatch) {
                    msg += `  • @${matchMatch[2]} vs @${matchMatch[3]}\n`;
                }
                else {
                    msg += `  • ${line}\n`;
                }
            });
            // Display in a single chat bubble WITH author and photo
            const msgWrapper = document.createElement("div");
            msgWrapper.className = `messenger-message-wrapper${self ? " self" : ""}${isGrouped ? " grouped" : ""}`;
            if (!self && !isGrouped) {
                const usernameSpan = document.createElement("span");
                usernameSpan.textContent = displayName;
                usernameSpan.className = `messenger-username`;
                msgWrapper.appendChild(usernameSpan);
            }
            const row = document.createElement("div");
            row.className = "messenger-message-row";
            if (!self && !isGrouped) {
                const profileImg = document.createElement("img");
                profileImg.src = profilePic;
                profileImg.alt = `${displayName}'s profile picture`;
                profileImg.className = "messenger-avatar";
                if (!isSystem) {
                    const user = userMap.get(authorId);
                    profileImg.onclick = () => showProfileCard((user === null || user === void 0 ? void 0 : user.username) || `User#${authorId}`, (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png", (user === null || user === void 0 ? void 0 : user.email) || "Email not available", (user === null || user === void 0 ? void 0 : user.bio) || "No bio available", (user === null || user === void 0 ? void 0 : user.id) || 0);
                }
                row.appendChild(profileImg);
            }
            else if (!self && isGrouped) {
                const spacer = document.createElement("div");
                spacer.className = "messenger-avatar-spacer";
                row.appendChild(spacer);
            }
            const messageContent = document.createElement("div");
            messageContent.className = `messenger-bubble${self ? " self" : ""}`;
            // Display line breaks with <br>
            messageContent.innerHTML = msg.trim().replace(/\n/g, '<br>');
            row.appendChild(messageContent);
            if (self && !isGrouped) {
                const spacer = document.createElement("div");
                spacer.className = "messenger-avatar-spacer";
                row.appendChild(spacer);
            }
            msgWrapper.appendChild(row);
            chatContainer.appendChild(msgWrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            lastAuthor = authorId;
            return;
        }
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `messenger-message-wrapper${self ? " self" : ""}${isGrouped ? " grouped" : ""}`;
        if (!self && !isGrouped) {
            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = displayName;
            usernameSpan.className = `messenger-username`;
            msgWrapper.appendChild(usernameSpan);
        }
        const row = document.createElement("div");
        row.className = "messenger-message-row";
        const messageContent = document.createElement("div");
        let mentionMatch = content.match(/^@(\w+)/);
        let mentionClass = (!self && mentionMatch) ? " messenger-bubble-mention" : "";
        // Update regex to match the new English invite message
        const pongInviteRegex = /@([\w-]+) Click here to join my Pong game/;
        if (self && pongInviteRegex.test(content)) {
            const match = content.match(pongInviteRegex);
            const dest = match ? match[1] : "?";
            messageContent.textContent = `Invitation sent to : ${dest}`;
        }
        else if (!self && mentionMatch) {
            messageContent.innerHTML = content.replace(/^@(\w+)/, '<span class="chat-mention">@$1</span>');
        }
        else if (self && mentionMatch) {
            messageContent.innerHTML = content.replace(/^@(\w+)/, '<span class="chat-mention self">@$1</span>');
        }
        else {
            messageContent.textContent = content;
        }
        messageContent.className = `messenger-bubble${self ? " self" : ""}${mentionClass}`;
        if (!self && !isGrouped) {
            const profileImg = document.createElement("img");
            profileImg.src = profilePic;
            profileImg.alt = `${displayName}'s profile picture`;
            profileImg.className = "messenger-avatar";
            if (!isSystem) {
                const user = userMap.get(authorId);
                profileImg.onclick = () => showProfileCard((user === null || user === void 0 ? void 0 : user.username) || `User#${authorId}`, (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png", (user === null || user === void 0 ? void 0 : user.email) || "Email not available", (user === null || user === void 0 ? void 0 : user.bio) || "No bio available", (user === null || user === void 0 ? void 0 : user.id) || 0);
            }
            row.appendChild(profileImg);
            row.appendChild(messageContent);
        }
        else if (!self && isGrouped) {
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
            row.appendChild(messageContent);
        }
        else if (self && !isGrouped) {
            row.appendChild(messageContent);
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
        }
        else if (self && isGrouped) {
            row.appendChild(messageContent);
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
        }
        msgWrapper.appendChild(row);
        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        lastAuthor = authorId;
    };
    // Load message history
    const chatHistory = await fetchChatHistory(currentUser.id);
    // Display history with grouping
    let prevAuthor = null;
    for (const message of chatHistory) {
        const isSelf = message.author === currentUser.id;
        if (!isSelf && await isBlocked(((_a = userMap.get(message.author)) === null || _a === void 0 ? void 0 : _a.username) || ""))
            continue;
        // Fix: apply the same tournament formatting to history
        addMessage(message.content, message.author, isSelf);
    }
    // Connect client to Socket.IO server
    const socket = io(`https://${HOSTNAME}:8443/chat`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    socket.on("connect", () => {
        console.log("Connected to Socket.IO server");
        if (!currentUser) {
            // Cannot emit register without current user
            return;
        }
        socket.emit("register", { userId: currentUser.id, username: currentUser.username });
    });
    socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
    });
    socket.on("error", (error) => {
        console.error("Socket.IO error:", error);
    });
    let canSend = true;
    const COOLDOWN_MS = 1000;
    // Variable to track unread messages
    let unreadCount = 0;
    // Function to show notification badge
    function showBadge() {
        const badge = document.getElementById('chatBadge');
        if (badge) {
            badge.textContent = unreadCount.toString();
            badge.style.display = 'block';
        }
    }
    // Function to reset unread messages counter
    function resetBadge() {
        unreadCount = 0;
        const badge = document.getElementById('chatBadge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
    // Send a message to the server
    sendBtn.addEventListener("click", async () => {
        // Re-check authentication on each send
        if (!canSend) {
            return;
        }
        currentUser = await fetchCurrentUser();
        if (!currentUser) {
            if (chatContainer)
                chatContainer.innerHTML = "<div class='chat-error'>You have been disconnected. Please reconnect to use the chat.</div>";
            if (input)
                input.style.display = 'none';
            if (sendBtn)
                sendBtn.style.display = 'none';
            return;
        }
        const text = input.value.trim();
        if (text) {
            const mentionMatch = text.match(/^@(\w+)/);
            canSend = false;
            sendBtn.disabled = true;
            if (mentionMatch && mentionMatch[1] === currentUser.username) {
                showErrorNotification("You can't mention yourself.");
                canSend = true;
                sendBtn.disabled = false;
                return;
            }
            if (mentionMatch) {
                const targetUser = users.find(u => u.username === mentionMatch[1]);
                if (!targetUser) {
                    showErrorNotification("User not found");
                    canSend = true;
                    sendBtn.disabled = false;
                    return;
                }
                socket.emit("sendPrivateMessage", { to: String(targetUser.id), author: String(currentUser.id), content: text }, (response) => { });
                addMessage(text, currentUser.id, true);
            }
            else {
                socket.emit("sendMessage", { author: currentUser.id, content: text }, (response) => { });
                addMessage(text, currentUser.id, true);
            }
            input.value = "";
            setTimeout(() => {
                canSend = true;
                sendBtn.disabled = false;
            }, COOLDOWN_MS);
        }
    });
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });
    // Receive a message from the server
    socket.on("receiveMessage", async (messageData) => {
        var _a;
        const authorId = Number(messageData.author);
        if (!currentUser)
            return;
        if (authorId === currentUser.id)
            return;
        if (await isBlocked(((_a = userMap.get(authorId)) === null || _a === void 0 ? void 0 : _a.username) || ""))
            return;
        if (!userMap.has(authorId)) {
            const newUsers = await fetchUsernames();
            userMap.clear();
            newUsers.forEach(user => userMap.set(user.id, user));
        }
        if (!userMap.has(authorId))
            return;
        addMessage(messageData.content, authorId, false);
    });
    socket.on("receivePrivateMessage", async (messageData) => {
        var _a;
        const authorId = Number(messageData.author);
        // Always update userMap with received info
        if (messageData.authorInfo) {
            userMap.set(authorId, {
                id: messageData.authorInfo.id,
                username: messageData.authorInfo.username,
                profile_picture: messageData.authorInfo.profile_picture,
                email: '',
                bio: '',
                isOnline: false
            });
        }
        if (await isBlocked(((_a = userMap.get(authorId)) === null || _a === void 0 ? void 0 : _a.username) || ""))
            return;
        if (!userMap.has(authorId)) {
            const newUsers = await fetchUsernames();
            newUsers.forEach(user => userMap.set(user.id, user));
        }
        addMessage(messageData.content, authorId, false);
    });
    // Mention @ suggestion
    let mentionActive = false;
    let mentionStart = -1;
    let filteredSuggestions = [];
    function updateMentionBox() {
        if (!mentionActive || filteredSuggestions.length === 0) {
            mentionBox.style.display = "none";
            return;
        }
        mentionBox.innerHTML = "";
        filteredSuggestions.forEach(username => {
            const item = document.createElement("div");
            item.textContent = "@" + username;
            item.style.padding = "6px 16px";
            item.style.cursor = "pointer";
            item.style.color = "#66c0f4";
            item.onmouseenter = () => item.style.background = "#2a475e";
            item.onmouseleave = () => item.style.background = "";
            item.onclick = () => {
                // Replace @... with @username
                const val = input.value;
                const before = val.slice(0, mentionStart);
                const after = val.slice(input.selectionStart);
                input.value = before + "@" + username + " " + after;
                mentionBox.style.display = "none";
                mentionActive = false;
                input.focus();
                // Place the cursor after the mention
                const pos = (before + "@" + username + " ").length;
                input.setSelectionRange(pos, pos);
            };
            mentionBox.appendChild(item);
        });
        // Position the box just below the input, floating overlay
        const rect = input.getBoundingClientRect();
        mentionBox.style.left = rect.left + "px";
        mentionBox.style.top = (rect.bottom + 2) + "px";
        mentionBox.style.width = rect.width + "px";
        mentionBox.style.display = "block";
    }
    // Add: repositions the mentionBox on resize
    window.addEventListener("resize", () => {
        if (mentionActive && mentionBox.style.display === "block") {
            updateMentionBox();
        }
    });
    input.addEventListener("input", (e) => {
        const val = input.value;
        const pos = input.selectionStart || 0;
        // Search for the last @ before the cursor
        const before = val.slice(0, pos);
        const match = before.match(/@([\w]*)$/);
        if (match) {
            mentionActive = true;
            mentionStart = before.lastIndexOf("@");
            const search = match[1].toLowerCase();
            if (!currentUser) {
                filteredSuggestions = [];
            }
            else {
                filteredSuggestions = usernames.filter(u => u.toLowerCase().startsWith(search) && u !== (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username)).slice(0, 8);
            }
            updateMentionBox();
        }
        else {
            mentionActive = false;
            mentionBox.style.display = "none";
        }
    });
    // Closes the box if clicking elsewhere
    document.addEventListener("click", (e) => {
        if (e.target !== input && e.target !== mentionBox) {
            mentionBox.style.display = "none";
            mentionActive = false;
        }
    });
    // Keyboard navigation (arrows + enter)
    input.addEventListener("keydown", (e) => {
        if (!mentionActive || mentionBox.style.display === "none")
            return;
        const items = Array.from(mentionBox.children);
        let idx = items.findIndex(item => item.classList.contains("active"));
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (idx >= 0)
                items[idx].classList.remove("active");
            idx = (idx + 1) % items.length;
            items[idx].classList.add("active");
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (idx >= 0)
                items[idx].classList.remove("active");
            idx = (idx - 1 + items.length) % items.length;
            items[idx].classList.add("active");
        }
        else if (e.key === "Enter" && idx >= 0) {
            e.preventDefault();
            items[idx].click();
        }
    });
    // Clear shared cache at the start of setupChat
    clearBlockedCache();
    // Uses centralized handling of Pong invite links
    document.addEventListener('click', handlePongInviteLinkClick);
}
