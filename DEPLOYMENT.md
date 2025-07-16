# SYNAPE EARN Bot - cPanel Deployment Instructions

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
