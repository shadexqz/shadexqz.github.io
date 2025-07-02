document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        document.getElementById('auth-modal').style.display = 'none';
        
        // Update server header with user's server
        const userData = JSON.parse(user);
        document.getElementById('server-header').textContent = userData.servers.length > 0 ? 
            userData.servers[0].name : 'My Server';
    } else {
        document.getElementById('auth-modal').style.display = 'flex';
    }
});
