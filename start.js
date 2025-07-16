#!/usr/bin/env node

// SYNAPE EARN Bot - cPanel Startup Script
const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for production
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3001;

console.log('🚀 Starting SYNAPE EARN Bot on cPanel...');

// Start the main application
const mainProcess = spawn('node', ['index.js'], {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env
});

mainProcess.on('error', (error) => {
    console.error('❌ Application error:', error);
    process.exit(1);
});

mainProcess.on('exit', (code) => {
    console.log(`📱 Application exited with code ${code}`);
    if (code !== 0) {
        process.exit(code);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    mainProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    mainProcess.kill('SIGTERM');
});
