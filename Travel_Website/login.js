document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store user data and token
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to index.html
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Login failed. Please try again.');
    }
});

// Check auth status on page load
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        window.location.href = 'index.html';
    }
}

checkAuth();
