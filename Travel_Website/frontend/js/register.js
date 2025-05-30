document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Client-side validation
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                    credentials: 'include'
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Registration successful!');
                    window.location.href = '/dashboard.html';
                } else {
                    alert(data.message || 'Registration failed');
                }
            } catch (err) {
                console.error('Registration error:', err);
                alert('Registration failed. Please try again.');
            }
        });
    }
});
