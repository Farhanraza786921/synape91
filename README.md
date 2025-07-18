# SYNAPE EARN - Telegram Referral Bot

A complete Telegram referral bot system with admin panel for managing users and withdrawals.

## Features

✅ **Telegram Bot Features:**
- Channel subscription verification
- Unique referral link generation
- ₹5 reward per successful referral
- Wallet management with ₹300 minimum withdrawal
- UPI ID setup for payouts
- User-friendly interface with inline keyboards

✅ **Admin Panel Features:**
- Secure admin authentication
- User management and statistics
- Withdrawal request processing
- Real-time dashboard with charts
- Balance adjustment capabilities
- Export functionality

✅ **Security Features:**
- JWT-based admin authentication
- Input validation and sanitization
- CORS protection
- Session management
- Error handling

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone/Extract the project:**
   ```bash
   cd synape-earn-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the system:**
   ```bash
   npm start
   ```

### Access Points

- **Telegram Bot:** [@synapeearn_bot](https://t.me/synapeearn_bot)
- **Admin Panel:** http://localhost:3001/admin/login
- **Admin Credentials:** 
  - Username: `heart`
  - Password: `heart`

## Configuration

### Bot Configuration
The bot is pre-configured with:
- **Bot Token:** `7642601533:AAEyv_A3WxID7p2sGpET7TazuDxSqR9mB_Y`
- **Channel:** `@synape`
- **Referral Reward:** ₹5 per referral
- **Minimum Withdrawal:** ₹300

### Admin Configuration
- **Username:** `heart`
- **Password:** `heart`
- **Port:** `3001`

## File Structure

```
synape-earn-bot/
├── bot/
│   └── bot.js              # Main Telegram bot logic
├── admin/
│   ├── server.js           # Express.js admin server
│   └── views/
│       ├── login.html      # Admin login page
│       └── dashboard.html  # Admin dashboard
├── data/                   # JSON database files
│   ├── users.json          # User data
│   ├── withdrawals.json    # Withdrawal requests
│   └── admin_sessions.json # Admin sessions
├── index.js                # Main application entry point
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## API Endpoints

### Admin Authentication
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout

### Admin Dashboard
- `GET /admin/api/stats` - Dashboard statistics
- `GET /admin/api/users` - Get all users
- `GET /admin/api/withdrawals` - Get all withdrawals
- `POST /admin/api/withdrawals/:id/approve` - Approve withdrawal
- `POST /admin/api/withdrawals/:id/reject` - Reject withdrawal
- `POST /admin/api/users/:id/balance` - Update user balance

## Deployment

### For cPanel Hosting

1. **Upload files to your hosting:**
   - Upload all files to your domain's public_html folder
   - Ensure Node.js is enabled on your hosting

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Configure domain:**
   - Point your domain to the application
   - Update any hardcoded URLs if necessary

### Environment Variables (Optional)

You can set these environment variables for production:

```bash
PORT=3001                    # Admin panel port
BOT_TOKEN=your_bot_token     # Telegram bot token
ADMIN_USERNAME=heart         # Admin username
ADMIN_PASSWORD=heart         # Admin password
```

## Usage Guide

### For Users

1. **Start the bot:** Send `/start` to [@synapeearn_bot](https://t.me/synapeearn_bot)
2. **Join channel:** Subscribe to [@synape](https://t.me/synape)
3. **Get referral link:** Use "Get Referral Link" button
4. **Share and earn:** Share your link to earn ₹5 per referral
5. **Set UPI ID:** Add your UPI ID for withdrawals
6. **Withdraw:** Request withdrawal when balance ≥ ₹300

### For Admins

1. **Access admin panel:** Go to `/admin/login`
2. **Login:** Use credentials `heart` / `heart`
3. **Monitor users:** View user statistics and activity
4. **Process withdrawals:** Approve or reject withdrawal requests
5. **Manage balances:** Adjust user balances if needed

## Bot Commands

- `/start` - Start the bot and register
- `/start REFERRAL_CODE` - Start with referral code

## Bot Buttons

- 🔗 **Get Referral Link** - Generate your unique referral link
- 💰 **Wallet** - View balance and request withdrawal
- 💳 **Set UPI ID** - Set/update UPI ID for payments
- ❓ **How to Use Bot** - View usage instructions

## Data Storage

The system uses JSON files for data storage:

- **users.json:** User profiles, balances, referrals
- **withdrawals.json:** Withdrawal requests and status
- **admin_sessions.json:** Admin authentication sessions

## Security Notes

- Change default admin credentials in production
- Use HTTPS for admin panel in production
- Regularly backup data files
- Monitor for suspicious activity

## Support

For technical support or questions:
- Check the logs for error messages
- Ensure all dependencies are installed
- Verify bot token and channel settings
- Contact system administrator

## License

This project is licensed under the MIT License.

---

**SYNAPE EARN Bot System v1.0**  
Built with Node.js, Express.js, and Telegram Bot API

#   s y n a p e 9 1  
 #   s y n a p e 9 1  
 