const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Admin credentials
const ADMIN_USERNAME = 'heart';
const ADMIN_PASSWORD = 'heart';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use('/admin/public', express.static(path.join(__dirname, 'public')));

// Data file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'admin_sessions.json');

// Ensure data directory and files exist
async function initializeData() {
    await fs.ensureDir(DATA_DIR);
    
    if (!await fs.pathExists(USERS_FILE)) {
        await fs.writeJson(USERS_FILE, {});
    }
    
    if (!await fs.pathExists(WITHDRAWALS_FILE)) {
        await fs.writeJson(WITHDRAWALS_FILE, []);
    }
    
    if (!await fs.pathExists(SESSIONS_FILE)) {
        await fs.writeJson(SESSIONS_FILE, {});
    }
}

// Load data functions
async function loadUsers() {
    try {
        return await fs.readJson(USERS_FILE);
    } catch (error) {
        return {};
    }
}

async function saveUsers(users) {
    await fs.writeJson(USERS_FILE, users, { spaces: 2 });
}

async function loadWithdrawals() {
    try {
        return await fs.readJson(WITHDRAWALS_FILE);
    } catch (error) {
        return [];
    }
}

async function saveWithdrawals(withdrawals) {
    await fs.writeJson(WITHDRAWALS_FILE, withdrawals, { spaces: 2 });
}

async function loadSessions() {
    try {
        return await fs.readJson(SESSIONS_FILE);
    } catch (error) {
        return {};
    }
}

async function saveSessions(sessions) {
    await fs.writeJson(SESSIONS_FILE, sessions, { spaces: 2 });
}

// Authentication middleware
async function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const sessions = await loadSessions();
    
    if (!sessions[token] || sessions[token].expires < Date.now()) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.adminId = sessions[token].adminId;
    next();
}

// Generate session token
function generateToken() {
    return uuidv4().replace(/-/g, '');
}

// Routes

// Serve login page
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Serve dashboard page
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Redirect admin root to login
app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

// Admin login
app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const token = generateToken();
            const sessions = await loadSessions();
            
            // Clean expired sessions
            const now = Date.now();
            Object.keys(sessions).forEach(key => {
                if (sessions[key].expires < now) {
                    delete sessions[key];
                }
            });
            
            // Create new session
            sessions[token] = {
                adminId: 'admin',
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            
            await saveSessions(sessions);
            
            res.json({ 
                success: true, 
                token: token,
                message: 'Login successful' 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Admin logout
app.post('/admin/logout', authenticateAdmin, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);
        
        const sessions = await loadSessions();
        delete sessions[token];
        await saveSessions(sessions);
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get dashboard stats
app.get('/admin/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const users = await loadUsers();
        const withdrawals = await loadWithdrawals();
        
        const totalUsers = Object.keys(users).length;
        const activeUsers = Object.values(users).filter(user => user.isActive).length;
        const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');
        const totalPayouts = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
        
        res.json({
            totalUsers,
            activeUsers,
            totalPayouts,
            pendingWithdrawals
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all users
app.get('/admin/api/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await loadUsers();
        res.json(users);
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get specific user
app.get('/admin/api/users/:userId', authenticateAdmin, async (req, res) => {
    try {
        const users = await loadUsers();
        const user = users[req.params.userId];
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('User error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user balance
app.post('/admin/api/users/:userId/balance', authenticateAdmin, async (req, res) => {
    try {
        const { amount, action } = req.body; // action: 'add' or 'set'
        const users = await loadUsers();
        const user = users[req.params.userId];
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        if (action === 'add') {
            user.walletBalance += parseFloat(amount);
        } else if (action === 'set') {
            user.walletBalance = parseFloat(amount);
        }
        
        // Ensure balance doesn't go negative
        user.walletBalance = Math.max(0, user.walletBalance);
        
        await saveUsers(users);
        
        res.json({ 
            success: true, 
            message: 'Balance updated successfully',
            newBalance: user.walletBalance
        });
    } catch (error) {
        console.error('Balance update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all withdrawals
app.get('/admin/api/withdrawals', authenticateAdmin, async (req, res) => {
    try {
        const withdrawals = await loadWithdrawals();
        res.json(withdrawals);
    } catch (error) {
        console.error('Withdrawals error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Approve withdrawal
app.post('/admin/api/withdrawals/:withdrawalId/approve', authenticateAdmin, async (req, res) => {
    try {
        const withdrawals = await loadWithdrawals();
        const withdrawal = withdrawals.find(w => w.id === req.params.withdrawalId);
        
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }
        
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Withdrawal already processed' });
        }
        
        withdrawal.status = 'approved';
        withdrawal.processedAt = new Date().toISOString();
        withdrawal.processedBy = req.adminId;
        
        await saveWithdrawals(withdrawals);
        
        res.json({ 
            success: true, 
            message: 'Withdrawal approved successfully' 
        });
    } catch (error) {
        console.error('Approve withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reject withdrawal
app.post('/admin/api/withdrawals/:withdrawalId/reject', authenticateAdmin, async (req, res) => {
    try {
        const withdrawals = await loadWithdrawals();
        const withdrawal = withdrawals.find(w => w.id === req.params.withdrawalId);
        
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }
        
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Withdrawal already processed' });
        }
        
        withdrawal.status = 'rejected';
        withdrawal.processedAt = new Date().toISOString();
        withdrawal.processedBy = req.adminId;
        
        // Restore user balance
        const users = await loadUsers();
        if (users[withdrawal.userId]) {
            users[withdrawal.userId].walletBalance += withdrawal.amount;
            await saveUsers(users);
        }
        
        await saveWithdrawals(withdrawals);
        
        res.json({ 
            success: true, 
            message: 'Withdrawal rejected and balance restored' 
        });
    } catch (error) {
        console.error('Reject withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user growth data for chart
app.get('/admin/api/analytics/user-growth', authenticateAdmin, async (req, res) => {
    try {
        const users = await loadUsers();
        const usersByDate = {};
        
        Object.values(users).forEach(user => {
            const date = new Date(user.joinedAt).toDateString();
            usersByDate[date] = (usersByDate[date] || 0) + 1;
        });
        
        const sortedDates = Object.keys(usersByDate).sort((a, b) => new Date(a) - new Date(b));
        const labels = sortedDates.slice(-7); // Last 7 days
        const data = labels.map(date => usersByDate[date] || 0);
        
        res.json({ labels, data });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get recent activity
app.get('/admin/api/activity', authenticateAdmin, async (req, res) => {
    try {
        const users = await loadUsers();
        const withdrawals = await loadWithdrawals();
        
        const activities = [];
        
        // Recent users
        Object.values(users)
            .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
            .slice(0, 5)
            .forEach(user => {
                activities.push({
                    type: 'user_joined',
                    message: `${user.firstName} joined`,
                    timestamp: user.joinedAt,
                    icon: 'user-plus',
                    color: 'green'
                });
            });
        
        // Recent withdrawals
        withdrawals
            .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
            .slice(0, 5)
            .forEach(withdrawal => {
                activities.push({
                    type: 'withdrawal_request',
                    message: `₹${withdrawal.amount} withdrawal requested`,
                    timestamp: withdrawal.requestedAt,
                    icon: 'money-bill-wave',
                    color: 'blue'
                });
            });
        
        // Sort by timestamp and return latest 10
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(activities.slice(0, 10));
    } catch (error) {
        console.error('Activity error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Search users
app.get('/admin/api/users/search/:query', authenticateAdmin, async (req, res) => {
    try {
        const users = await loadUsers();
        const query = req.params.query.toLowerCase();
        
        const filteredUsers = Object.values(users).filter(user => 
            user.firstName?.toLowerCase().includes(query) ||
            user.username?.toLowerCase().includes(query) ||
            user.id.toString().includes(query)
        );
        
        res.json(filteredUsers);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Export data
app.get('/admin/api/export/:type', authenticateAdmin, async (req, res) => {
    try {
        const type = req.params.type;
        let data;
        
        if (type === 'users') {
            data = await loadUsers();
        } else if (type === 'withdrawals') {
            data = await loadWithdrawals();
        } else {
            return res.status(400).json({ success: false, message: 'Invalid export type' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_export_${Date.now()}.json`);
        res.send(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check
app.get('/admin/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint not found' 
    });
});

// Start server
async function startServer() {
    await initializeData();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Admin server running on port ${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/admin/dashboard`);
        console.log(`🔐 Login: http://localhost:${PORT}/admin/login`);
        console.log(`👤 Admin credentials: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
    });
}

startServer().catch(console.error);

module.exports = app;

