#!/bin/bash

# SYNAPE EARN Bot - Installation Script
# This script helps set up the bot on a new server

echo "🚀 SYNAPE EARN Bot - Installation Script"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create data directory if it doesn't exist
mkdir -p data

# Set permissions
chmod 755 data
chmod 644 data/*.json 2>/dev/null || true

echo "✅ Permissions set"

# Create systemd service file (optional)
if command -v systemctl &> /dev/null; then
    echo "🔧 Creating systemd service..."
    
    cat > synape-earn-bot.service << EOF
[Unit]
Description=SYNAPE EARN Telegram Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    echo "📝 Service file created: synape-earn-bot.service"
    echo "   To install: sudo cp synape-earn-bot.service /etc/systemd/system/"
    echo "   To enable: sudo systemctl enable synape-earn-bot"
    echo "   To start: sudo systemctl start synape-earn-bot"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📱 Bot Information:"
echo "   - Bot Username: @synapeearn_bot"
echo "   - Channel: @synape"
echo "   - Bot Token: 7642601533:AAEyv_A3WxID7p2sGpET7TazuDxSqR9mB_Y"
echo ""
echo "🖥️  Admin Panel:"
echo "   - URL: http://localhost:3001/admin/login"
echo "   - Username: heart"
echo "   - Password: heart"
echo ""
echo "🚀 To start the bot:"
echo "   npm start"
echo ""
echo "📖 For deployment instructions, read DEPLOYMENT.md"
echo ""

