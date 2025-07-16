const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting SYNAPE EARN Bot System...\n');

// Start the Telegram bot
console.log('📱 Starting Telegram Bot...');
const botProcess = spawn('node', [path.join(__dirname, 'bot', 'bot.js')], {
    stdio: 'inherit',
    cwd: __dirname
});

// Start the admin server
console.log('🖥️  Starting Admin Server...');
const adminProcess = spawn('node', [path.join(__dirname, 'admin', 'server.js')], {
    stdio: 'inherit',
    cwd: __dirname
});

// Handle process errors
botProcess.on('error', (error) => {
    console.error('❌ Bot process error:', error);
});

adminProcess.on('error', (error) => {
    console.error('❌ Admin process error:', error);
});

// Handle process exits
botProcess.on('exit', (code, signal) => {
    console.log(`📱 Bot process exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
        console.log('🔄 Restarting bot...');
        setTimeout(() => {
            spawn('node', [path.join(__dirname, 'bot', 'bot.js')], {
                stdio: 'inherit',
                cwd: __dirname
            });
        }, 5000);
    }
});

adminProcess.on('exit', (code, signal) => {
    console.log(`🖥️  Admin process exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
        console.log('🔄 Restarting admin server...');
        setTimeout(() => {
            spawn('node', [path.join(__dirname, 'admin', 'server.js')], {
                stdio: 'inherit',
                cwd: __dirname
            });
        }, 5000);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    botProcess.kill('SIGINT');
    adminProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    botProcess.kill('SIGTERM');
    adminProcess.kill('SIGTERM');
    process.exit(0);
});

console.log('\n✅ SYNAPE EARN Bot System started successfully!');
console.log('📱 Telegram Bot: @synapeearn_bot');
console.log('📢 Channel: @synape');
console.log('🖥️  Admin Panel: http://localhost:3001/admin/login');
console.log('👤 Admin Login: heart / heart');
console.log('\n📊 System Status:');
console.log('- Bot: Running');
console.log('- Admin Panel: Running');
console.log('- Database: JSON Files');
console.log('\n🔧 To stop the system, press Ctrl+C');

