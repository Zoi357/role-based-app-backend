let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';

window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

/* STORAGE */
function loadFromStorage() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
        window.db = data;
    } else {
        window.db.accounts.push({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: 'Password123!',
            verified: true,
            role: 'admin'
        });
        window.db.departments.push({ id: 1, name: 'Engineering' });
        window.db.departments.push({ id: 2, name: 'HR' });
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

/* ROUTING */
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (hash === '#/register') show('register-page');
    else if (hash === '#/verify-email') show('verify-email-page');
    else if (hash === '#/login') show('login-page');
    else if (hash === '#/profile') {
        if (!currentUser) return navigateTo('#/login');
        show('profile-page'); renderProfile();
    }
    else if (hash === '#/requests') {
        if (!currentUser) return navigateTo('#/login');
        show('requests-page');
    }
    else if (['#/employees','#/accounts','#/departments'].includes(hash)) {
        if (!currentUser || currentUser.role !== 'admin') return navigateTo('#/');
        show(hash.replace('#/','') + '-page');
    }
    else show('home-page');
}

function show(id) {
    document.getElementById(id).classList.add('active');
}

/* AUTH */
function setAuthState(isAuth, user = null) {
    currentUser = user;
    document.body.classList.toggle('authenticated', isAuth);
    document.body.classList.toggle('not-authenticated', !isAuth);
    document.body.classList.toggle('is-admin', user && user.role === 'admin');
    if (user) document.getElementById('nav-username').textContent = user.firstName;
}

function logout() {
    localStorage.removeItem('auth_token');
    setAuthState(false);
    navigateTo('#/');
}

/* EVENTS */
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();

    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window.db.accounts.find(a => a.email === token);
        if (user) setAuthState(true, user);
    }

    handleRouting();
});

window.addEventListener('hashchange', handleRouting);

/* REGISTER */
document.getElementById('register-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = registerEmail.value;
    if (window.db.accounts.some(a => a.email === email)) return alert('Email exists');

    window.db.accounts.push({
        firstName: firstName.value,
        lastName: lastName.value,
        email,
        password: registerPassword.value,
        verified: false,
        role: 'user'
    });
    saveToStorage();
    localStorage.setItem('unverified_email', email);
    navigateTo('#/verify-email');
});

/* VERIFY */
document.getElementById('verify-btn').addEventListener('click', () => {
    const email = localStorage.getItem('unverified_email');
    const user = window.db.accounts.find(a => a.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        navigateTo('#/login');
    }
});

/* LOGIN */
document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const user = window.db.accounts.find(a =>
        a.email === loginEmail.value &&
        a.password === loginPassword.value &&
        a.verified
    );

    if (!user) return alert('Invalid login');
    localStorage.setItem('auth_token', user.email);
    setAuthState(true, user);
    navigateTo('#/profile');
});

document.getElementById('logout-btn').addEventListener('click', logout);

/* PROFILE */
function renderProfile() {
    profile-info.innerHTML =`
        <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> ${currentUser.role}</p>
    `;
}
