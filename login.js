// Login Page JavaScript
// Detect API base URL - use current origin if served from server, otherwise default to localhost:3000
function getApiBaseUrl() {
    if (window.location.protocol === 'file:') {
        return 'http://localhost:3000/api';
    }
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:3000/api`;
    }
    return `${window.location.origin}/api`;
}

const API_BASE_URL = getApiBaseUrl();

// Test server connection on page load
async function testServerConnection() {
    try {
        const healthUrl = API_BASE_URL.replace('/api', '') + '/api/health';
        const response = await fetch(healthUrl, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            console.log('✓ Server is running');
            return true;
        }
    } catch (error) {
        console.warn('⚠ Server connection test failed:', error);
        // Show a helpful message if server is not running
        const errorDiv = document.createElement('div');
        errorDiv.className = 'server-warning';
        errorDiv.style.cssText = 'background: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center;';
        errorDiv.innerHTML = `
            <strong>⚠ Server Not Running</strong><br>
            Please start the server by running: <code>npm start</code> in the project directory<br>
            Then refresh this page.
        `;
        const loginCard = document.querySelector('.login-card');
        if (loginCard && !document.querySelector('.server-warning')) {
            loginCard.insertBefore(errorDiv, loginCard.firstChild);
        }
        return false;
    }
    return false;
}

// Check if accessing via file:// protocol
if (window.location.protocol === 'file:') {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'server-warning';
    errorDiv.style.cssText = 'background: #FEE2E2; border: 1px solid #EF4444; color: #991B1B; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;';
    errorDiv.innerHTML = `
        <strong>⚠ Cannot Access Server</strong><br>
        You're opening this file directly. Please access it through the server:<br>
        <strong>http://localhost:3000</strong><br>
        <small>Make sure to run <code>npm start</code> first</small>
    `;
    const loginCard = document.querySelector('.login-card');
    if (loginCard && !document.querySelector('.server-warning')) {
        loginCard.insertBefore(errorDiv, loginCard.firstChild);
    }
}

// Test connection when page loads
testServerConnection();

// Toggle between login and register
const registerLink = document.getElementById('registerLink');
const loginLink = document.getElementById('loginLink');
const loginCard = document.querySelector('.login-card');
const registerCard = document.getElementById('registerCard');

registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
});

loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
});

// Password toggle visibility
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('password');
const regPasswordToggle = document.getElementById('regPasswordToggle');
const regPasswordInput = document.getElementById('regPassword');

passwordToggle.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
});

regPasswordToggle.addEventListener('click', () => {
    const type = regPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    regPasswordInput.setAttribute('type', type);
});

// Login Form Handler
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginBtnLoader = document.getElementById('loginBtnLoader');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.style.display = 'none';
    loginBtnLoader.style.display = 'flex';
    errorMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for cookies
            body: JSON.stringify({ email, password, rememberMe }),
        });
        
        // Check if response is ok before parsing JSON
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            throw new Error('Invalid response from server. Make sure the server is running.');
        }
        
        if (response.ok) {
            // Success - redirect to main app
            window.location.href = 'index.html';
        } else {
            // Show error
            errorMessage.textContent = data.message || 'Invalid email or password';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMsg = 'Connection error. ';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg += 'Make sure the server is running on http://localhost:3000';
        } else {
            errorMsg += error.message;
        }
        errorMessage.textContent = errorMsg;
        errorMessage.style.display = 'block';
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtnText.style.display = 'inline';
        loginBtnLoader.style.display = 'none';
    }
});

// Register Form Handler
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const registerBtnText = document.getElementById('registerBtnText');
const registerBtnLoader = document.getElementById('registerBtnLoader');
const registerErrorMessage = document.getElementById('registerErrorMessage');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Client-side validation
    if (password !== confirmPassword) {
        registerErrorMessage.textContent = 'Passwords do not match';
        registerErrorMessage.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        registerErrorMessage.textContent = 'Password must be at least 6 characters';
        registerErrorMessage.style.display = 'block';
        return;
    }
    
    // Show loading state
    registerBtn.disabled = true;
    registerBtnText.style.display = 'none';
    registerBtnLoader.style.display = 'flex';
    registerErrorMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password }),
        });
        
        // Check if response is ok before parsing JSON
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            throw new Error('Invalid response from server. Make sure the server is running.');
        }
        
        if (response.ok) {
            // Success - redirect to main app
            window.location.href = 'index.html';
        } else {
            // Show error
            registerErrorMessage.textContent = data.message || 'Registration failed';
            registerErrorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Register error:', error);
        let errorMsg = 'Connection error. ';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg += 'Make sure the server is running on http://localhost:3000';
        } else {
            errorMsg += error.message;
        }
        registerErrorMessage.textContent = errorMsg;
        registerErrorMessage.style.display = 'block';
    } finally {
        // Reset button state
        registerBtn.disabled = false;
        registerBtnText.style.display = 'inline';
        registerBtnLoader.style.display = 'none';
    }
});

