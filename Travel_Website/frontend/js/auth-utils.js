// Session verification
export async function verifySession() {
    try {
        const response = await fetch('/api/auth/verify-session', {
            credentials: 'include'
        });
        return await response.json();
    } catch (err) {
        console.error('Session verification failed:', err);
        return { authenticated: false };
    }
}

// Logout handler
export async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        return true;
    } catch (err) {
        console.error('Logout failed:', err);
        return false;
    }
}

// Auth check for protected pages
export async function checkAuth() {
    const session = await verifySession();
    if (!session.authenticated) {
        window.location.href = '/login.html';
    }
    return session;
}

// Render auth UI based on session
export function renderAuthUI(session) {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    if (session.authenticated) {
        authSection.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-3">Welcome, ${session.user.username}</span>
                <button class="btn btn-outline-danger btn-sm" id="logout-btn">Logout</button>
            </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await handleLogout();
            window.location.href = '/index.html';
        });
    } else {
        authSection.innerHTML = `
            <div class="d-flex">
                <a href="login.html" class="btn btn-outline-primary me-2">Login</a>
                <a href="register.html" class="btn btn-primary">Sign Up</a>
            </div>
        `;
    }
}
