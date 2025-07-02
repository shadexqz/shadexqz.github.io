document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');

    // Load messages for a channel
    window.loadMessages = async function(channelId) {
        try {
            const response = await fetch(`/api/channels/${channelId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const messages = await response.json();
            renderMessages(messages);
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    };

    // Render messages
    function renderMessages(messages) {
        messagesContainer.innerHTML = '';

        if (messages.length === 0) {
            messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Send one to start the conversation!</div>';
            return;
        }

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `
                <div class="message-avatar" style="background-color: ${stringToColor(message.author.username)}">
                    ${message.author.username.charAt(0).toUpperCase()}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">${message.author.username}</span>
                        <span class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-text">${message.content}</div>
                </div>
            `;
            messagesContainer.appendChild(messageElement);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Generate color from string (for avatars)
    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const h = hash % 360;
        return `hsl(${h}, 60%, 50%)`;
    }

    // Handle message input
    messageInput.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            
            const content = this.value.trim();
            if (!content || !currentChannelId) return;

            try {
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content,
                        channel: currentChannelId
                    })
                });

                if (response.ok) {
                    this.value = '';
                    this.style.height = 'auto';
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to send message');
                }
            } catch (err) {
                console.error('Error sending message:', err);
                alert('An error occurred while sending message');
            }
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Socket.io message listener
    if (socket) {
        socket.on('receiveMessage', function(message) {
            if (message.channel === currentChannelId) {
                const messages = Array.from(document.querySelectorAll('.message')).map(el => {
                    return {
                        author: {
                            username: el.querySelector('.message-username').textContent,
                        },
                        content: el.querySelector('.message-text').textContent,
                        createdAt: new Date()
                    };
                });
                
                messages.push(message);
                renderMessages(messages);
            }
        });
    }
});
