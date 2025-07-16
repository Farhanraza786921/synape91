#!/usr/bin/env node

/**
 * SYNAPE EARN Bot - Deployment Script for cPanel
 * This script helps deploy the bot to cPanel hosting
 */

const fs = require('fs-extra');
const path = require('path');

console.log('🚀 SYNAPE EARN Bot - cPanel Deployment Setup\n');

async function setupDeployment() {
    try {
        // Create startup script for cPanel
        const startupScript = `#!/usr/bin/env node

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
    console.log(\`📱 Application exited with code \${code}\`);
    if (code !== 0) {
        process.exit(code);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down...');
    mainProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\\n🛑 Shutting down...');
    mainProcess.kill('SIGTERM');
});
`;

        await fs.writeFile(path.join(__dirname, 'start.js'), startupScript);
        
        // Create .htaccess for Apache (if needed)
        const htaccess = `# SYNAPE EARN Bot - Apache Configuration
RewriteEngine On

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Cache static files
<FilesMatch "\\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</FilesMatch>
`;

        await fs.writeFile(path.join(__dirname, '.htaccess'), htaccess);
        
        // Create deployment instructions
        const deployInstructions = `# SYNAPE EARN Bot - cPanel Deployment Instructions

## Prerequisites
1. cPanel hosting with Node.js support
2. SSH access (recommended) or File Manager
3. Domain or subdomain configured

## Deployment Steps

### Step 1: Upload Files
1. Compress the entire project folder into a ZIP file
2. Upload the ZIP file to your cPanel File Manager
3. Extract the ZIP file in your domain's public_html folder (or subdirectory)

### Step 2: Install Dependencies
1. Access your hosting via SSH or use cPanel Terminal
2. Navigate to your project directory
3. Install Node.js dependencies: npm install --production

### Step 3: Configure Node.js App
1. In cPanel, go to "Node.js Apps"
2. Create a new Node.js application
3. Set Application Startup File to: start.js

### Step 4: Start the Application
1. Click "Start" in the Node.js Apps interface
2. The bot should now be running

Good luck with your deployment! 🚀
`;

        await fs.writeFile(path.join(__dirname, 'DEPLOYMENT.md'), deployInstructions);
        
        console.log('✅ Deployment files created successfully!');
        console.log('\n📁 Created files:');
        console.log('  - start.js (cPanel startup script)');
        console.log('  - .htaccess (Apache configuration)');
        console.log('  - DEPLOYMENT.md (deployment instructions)');
        
        console.log('\n🚀 Ready for cPanel deployment!');
        console.log('📖 Read DEPLOYMENT.md for detailed instructions');
        
    } catch (error) {
        console.error('❌ Deployment setup failed:', error);
        process.exit(1);
    }
}

// Run deployment setup if this script is executed directly
if (require.main === module) {
    setupDeployment();
}

module.exports = { setupDeployment };

