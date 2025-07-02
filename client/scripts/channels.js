let currentChannelId = null;
let socket = null;

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize Socket.io
    socket = io({
        auth: {
            token: token
        }
    });

    // Join channel when a new one is selected
    function joinChannel(channelId) {
        if (currentChannelId) {
            socket.emit('leaveChannel', currentChannelId);
        }
        socket.emit('joinChannel', channelId);
        currentChannelId = channelId;
    }

    // Load channels for a server
    window.loadChannels = async function(serverId) {
        try {
            const response = await fetch(`/api/servers/${serverId}/channels`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const channels = await response.json();
            const channelsList = document.getElementById('channels-list');
            
            // Clear existing channels
            channelsList.innerHTML = `
                <div class="category">
                    <div class="category-name">Text Channels</div>
                </div>
                <div class="category">
                    <div class="category-name">Voice Channels</div>
                </div>
            `;

            // Add text channels
            const textChannelsContainer = channelsList.children[0];
            const voiceChannelsContainer = channelsList.children[1];

            channels.forEach(channel => {
                const channelElement = document.createElement('div');
                channelElement.className = 'channel';
                channelElement.dataset.channelId = channel._id;
                
                if (channel.type === 'text') {
                    channelElement.innerHTML = `
                        <span class="channel-hashtag">#</span>
                        <span class="channel-name">${channel.name}</span>
                    `;
                    textChannelsContainer.appendChild(channelElement);
                } else {
                    channelElement.innerHTML = `
                        <span class="channel-hashtag">🔊</span>
                        <span class="channel-name">${channel.name}</span>
                    `;
                    voiceChannelsContainer.appendChild(channelElement);
                }

                // Add click event
                channelElement.addEventListener('click', function() {
                    document.querySelectorAll('.channel').forEach(ch => {
                        ch.classList.remove('active');
                    });
                    this.classList.add('active');
                    loadMessages(channel._id);
                    joinChannel(channel._id);
                    
                    // Update chat header
                    document.querySelector('.chat-header-name').textContent = channel.name;
                    document.querySelector('.chat-header-hashtag').textContent = channel.type === 'text' ? '#' : '🔊';
                    document.querySelector('.chat-header-topic').textContent = channel.topic || '';
                    document.getElementById('message-input').placeholder = `Message ${channel.type === 'text' ? '#' : '🔊'}${channel.name}`;
                });
            });

            // Select first channel by default
            if (channels.length > 0) {
                const firstChannel = channels[0];
                document.querySelector(`.channel[data-channel-id="${firstChannel._id}"]`).classList.add('active');
                loadMessages(firstChannel._id);
                joinChannel(firstChannel._id);
                
                // Update chat header
                document.querySelector('.chat-header-name').textContent = firstChannel.name;
                document.querySelector('.chat-header-hashtag').textContent = firstChannel.type === 'text' ? '#' : '🔊';
                document.querySelector('.chat-header-topic').textContent = firstChannel.topic || '';
                document.getElementById('message-input').placeholder = `Message ${firstChannel.type === 'text' ? '#' : '🔊'}${firstChannel.name}`;
            }
        } catch (err) {
            console.error('Error loading channels:', err);
        }
    };
});
