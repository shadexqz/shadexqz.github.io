document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const serversSidebar = document.getElementById('servers-sidebar');
    const addServerBtn = document.getElementById('add-server');

    // Load user's servers
    async function loadServers() {
        try {
            const response = await fetch('/api/servers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const servers = await response.json();

            // Clear existing servers (except the default and add button)
            const existingServers = document.querySelectorAll('.server-icon:not(#add-server)');
            existingServers.forEach(server => {
                if (!server.classList.contains('add-server')) {
                    server.remove();
                }
            });

            // Add servers to sidebar
            servers.forEach(server => {
                const serverElement = document.createElement('div');
                serverElement.className = 'server-icon';
                serverElement.dataset.serverId = server._id;
                serverElement.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15v-2h2v2h-2zm0-12v8h2V5h-2z"></path>
                    </svg>
                `;
                
                // Insert before the separator
                serversSidebar.insertBefore(serverElement, document.querySelector('.server-separator'));

                // Add click event
                serverElement.addEventListener('click', function() {
                    document.querySelectorAll('.server-icon').forEach(icon => {
                        icon.classList.remove('active');
                    });
                    this.classList.add('active');
                    loadChannels(server._id);
                });
            });

            // Load first server by default
            if (servers.length > 0) {
                document.querySelector(`.server-icon[data-server-id="${servers[0]._id}"]`).classList.add('active');
                loadChannels(servers[0]._id);
            }
        } catch (err) {
            console.error('Error loading servers:', err);
        }
    }

    // Add server functionality
    addServerBtn.addEventListener('click', async function() {
        const serverName = prompt('Enter server name:');
        if (!serverName) return;

        try {
            const response = await fetch('/api/servers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: serverName })
            });

            if (response.ok) {
                loadServers();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to create server');
            }
        } catch (err) {
            console.error('Error creating server:', err);
            alert('An error occurred while creating server');
        }
    });

    loadServers();
});
