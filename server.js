const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'hahaha123';

app.use(cors({
    origin: ['http://localhost:3000']
}

));

app.use(express.json());

app.use(express.static('public'));


let users = [
    {id: 1, username: 'admin', email: 'admin@example.com', password: bcrypt.hashSync('adminpass', 10), role: 'admin', registered: false, status: 'active'},
    {id: 2, username: 'user1', email: 'user1@example.com', password: bcrypt.hashSync('user1pass', 10), role: 'user', registered: false, status: 'active'}
];

if (!users[0].password.includes('$2a$')) {
    users[0].password = bcrypt.hashSync('adminpass', 10);
    users[1].password = bcrypt.hashSync('user1pass', 10);   
}


app.post('/api/register', async (req, res) => {
    const {username, email, password, role = 'user'} = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({error: 'Username, email and password are required'});
    }
    if (!email.endsWith('@example.com')) {
        return res.status(400).json({error: 'Email must be @example.com'});
    }
    
    const existing = users.find(u => u.username === username || u.email === email);
    if (existing) {
        return res.status(400).json({error: 'Username or email already exists'});
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        email,
        password: hashedPassword,
        role,
        registered: true, 
        status: 'active'

    };

    users.push(newUser);
    res.status(201).json({message: 'User registered successfully', user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email }});

});

app.post('/api/login', async (req, res) => {
    const{username, password} = req.body;

    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return  res.status(401).json({error: 'Invalid credentials'});
    }

    const token= jwt.sign(
        {id:user.id, username: user.username, role: user.role},
        SECRET_KEY,
        {expiresIn: '1h'}

    );
    
    res.json({token, user: { id: user.id, username: user.username, role: user.role, email: user.email }});
});

app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({user: req.user});
});

app.get('/api/users', authenticateToken, authorizeRole('admin'), (req, res) => {
    const list = users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, status: u.status || 'active' }));
    res.json({ users: list });
});

app.delete('/api/users/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    if (req.user.id === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    if (users[idx].role === 'admin') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin account' });
        }
    }

    users.splice(idx, 1);
    res.json({ message: 'User deleted' });
});

app.put('/api/users/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const { username, email, role, status } = req.body;

    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const conflict = users.find(u => (u.username === username || u.email === email) && u.id !== id);
    if (conflict) return res.status(400).json({ error: 'Username or email already exists' });

    if (req.user.id === id && role !== 'admin') {
        return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    if (user.role === 'admin' && role !== 'admin') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) return res.status(400).json({ error: 'Cannot demote the last admin' });
    }

    if (req.user.id === id && status && status !== 'active') {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    user.username = username;
    user.email = email;
    user.role = role;
    if (status) user.status = status;

    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status } });
});

app.put('/api/profile', authenticateToken, (req, res) => {
    const { username, email } = req.body;
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const conflict = users.find(u => (u.username === username || u.email === email) && u.id !== user.id);
    if (conflict) return res.status(400).json({ error: 'Username or email already exists' });

    if (email && !email.endsWith('@example.com')) return res.status(400).json({ error: 'Email must be @example.com' });

    user.username = username;
    user.email = email;

    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

app.get('/api/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.json({message: 'Welcome to the admin area', data: 'Sensitive admin data'});
});

app.get('/api/content/guest', (req, res) => {
    res.json({message: 'Welcome, guest! Here is some public content.'});
});



function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token) {
        return res.status(401).json({error: 'Access Token required'});
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({error: 'Invalid or expiredtoken'});
        req.user = user;
        next();
    });
}



function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {   
            return res.status(403).json({error: 'Access denied: insufficient permissions'});

        }
        next();
    };
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Try logging in with');
    console.log('Admin: username: admin, password: adminpass');
    console.log('User: username: user1, password: user1pass');
});