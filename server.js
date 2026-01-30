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
    {id: 1, username: 'admin', password: bcrypt.hashSync('adminpass',), role: 'admin'},
    {id: 2, username: 'user1', password: bcrypt.hashSync('user1pass',), role: 'user'}
];

if (!users[0].password.includes('$2a$')) {
    users[0].password = bcrypt.hashSync('adminpass', 10);
    users[1].password = bcrypt.hashSync('user1pass', 10);   
}


app.post('/api/register', async (req, res) => {
    const {username, password, role = 'user'} = req.body;

    if (!username || !password) {
        return res.status(400).json({error: 'Username and password are required'});
    }
    
    const existing = users.find(u => u.username === username);
    if (existing) {
        return res.status(400).json({error: 'Username already exists'});
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        role

    };

    users.push(newUser);
    res.status(201).json({message: 'User registered successfully', username, role});

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
    
    res.json({token,user: {username: user.username, role: user.role}});
});

app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({user: req.user});
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

