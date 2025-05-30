import { verifySession, renderAuthUI } from './auth-utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check session and render UI
    const session = await verifySession();
    if (session.authenticated) {
        window.location.href = '../index.html';
        return;
    }

    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                if (response.ok) {
                    window.location.href = '../index.html';
                } else {
                    showError(data.message || 'Login failed');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            }
        });
    }
});

function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}
