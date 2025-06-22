const jwt = require('jsonwebtoken');
const user = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
exports.authenticateToken = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userData = await user.findById(decoded.userId).exec();
        
        if (!userData) {
            return res.status(401).send('Invalid token. User not found.');
        }
        
        req.user = userData;
        next();
    } catch (error) {
        return res.status(401).send('Invalid token.');
    }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.username === 'admin') {
        next();
    } else {
        res.status(403).send('Access denied. Admin privileges required.');
    }
};

// Generate JWT token
exports.generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}; 