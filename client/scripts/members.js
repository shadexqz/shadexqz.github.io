document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const membersSidebar = document.getElementById('members-sidebar');

    // Load members for a server
    window.loadMembers = async function(serverId) {
        try {
            const response = await fetch(`/api/servers/${serverId}/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const members = await response.json();
            renderMembers(members);
        } catch (err) {
            console.error('Error loading members:', err);
        }
    };

    // Render members
    function renderMembers(members) {
        const onlineMembers = members.filter(m => m.status !== 'offline');
        const offlineMembers = members.filter(m => m.status === 'offline');
        
        membersSidebar.innerHTML = `
            <div class="members-section">
                <div class="members-title">Online — <span id="online-count">${onlineMembers.length}</span></div>
                ${onlineMembers.map(member => `
                    <div class="member">
                        <div class="member-avatar" style="background-color: ${stringToColor(member.username)}">
                            ${member.username.charAt(0).toUpperCase()}
                            <div class="member-status status-${member.status}"></div>
                        </div>
                        <div class="member-name">${member.username}</div>
                    </div>
                `).join('')}
            </div>
            <div class="members-section">
                <div class="members-title">Offline — ${offlineMembers.length}</div>
                ${offlineMembers.map(member => `
                    <div class="member">
                        <div class="member-avatar" style="background-color: ${stringToColor(member.username)}">
                            ${member.username.charAt(0).toUpperCase()}
                            <div class="member-status status-offline"></div>
                        </div>
                        <div class="member-name">${member.username}</div>
                    </div>
                `).join('')}
            </div>
        `;
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
});
