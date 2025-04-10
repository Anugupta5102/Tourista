document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    // Check authentication via cookie
    fetch('/api/auth/verify-session', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.authenticated) {
            authSection.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="me-3">Welcome, ${data.user.username}</span>
                    <button class="btn btn-outline-danger btn-sm" id="logout-btn">Logout</button>
                </div>
            `;

            document.getElementById('logout-btn').addEventListener('click', () => {
                fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                }).then(() => window.location.href = 'index.html');
            });
        });
    } else {
        // User is not logged in - show login/signup buttons
        authSection.innerHTML = `
            <div class="d-flex">
                <a href="newLogin.html" class="btn btn-outline-primary me-2">Login</a>
                <a href="register.html" class="btn btn-primary">Sign Up</a>
            </div>
        `;
    }
}).catch(err => {
    console.error('Session verification failed:', err);
    authSection.innerHTML = `
        <div class="d-flex">
            <a href="newLogin.html" class="btn btn-outline-primary me-2">Login</a>
            <a href="register.html" class="btn btn-primary">Sign Up</a>
        </div>
    `;
});

// Add this to all protected pages to check auth status
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'newLogin.html';
    }
}
