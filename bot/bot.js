const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Bot configuration
const BOT_TOKEN = '7642601533:AAEyv_A3WxID7p2sGpET7TazuDxSqR9mB_Y';
const CHANNEL_USERNAME = '@synape'; // Channel to check subscription
const CHANNEL_ID = '@synape'; // Channel ID for verification
const REFERRAL_REWARD = 5; // ₹5 per referral
const MIN_WITHDRAWAL = 300; // ₹300 minimum withdrawal

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Data file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');

// Ensure data directory and files exist
async function initializeData() {
    await fs.ensureDir(DATA_DIR);
    
    if (!await fs.pathExists(USERS_FILE)) {
        await fs.writeJson(USERS_FILE, {});
    }
    
    if (!await fs.pathExists(WITHDRAWALS_FILE)) {
        await fs.writeJson(WITHDRAWALS_FILE, []);
    }
}

// Load users data
async function loadUsers() {
    try {
        return await fs.readJson(USERS_FILE);
    } catch (error) {
        return {};
    }
}

// Save users data
async function saveUsers(users) {
    await fs.writeJson(USERS_FILE, users, { spaces: 2 });
}

// Load withdrawals data
async function loadWithdrawals() {
    try {
        return await fs.readJson(WITHDRAWALS_FILE);
    } catch (error) {
        return [];
    }
}

// Save withdrawals data
async function saveWithdrawals(withdrawals) {
    await fs.writeJson(WITHDRAWALS_FILE, withdrawals, { spaces: 2 });
}

// Check if user is subscribed to channel
async function checkChannelSubscription(userId) {
    try {
        const member = await bot.getChatMember(CHANNEL_ID, userId);
        return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}

// Generate unique referral code
function generateReferralCode() {
    return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
}

// Create new user
async function createUser(userId, username, firstName, referredBy = null) {
    const users = await loadUsers();
    
    if (users[userId]) {
        return users[userId];
    }
    
    const referralCode = generateReferralCode();
    const user = {
        id: userId,
        username: username || '',
        firstName: firstName || '',
        referralCode: referralCode,
        referredBy: referredBy,
        referrals: [],
        walletBalance: 0,
        upiId: '',
        joinedAt: new Date().toISOString(),
        isActive: true
    };
    
    users[userId] = user;
    
    // If user was referred, credit the referrer
    if (referredBy && users[referredBy]) {
        users[referredBy].referrals.push(userId);
        users[referredBy].walletBalance += REFERRAL_REWARD;
        
        // Notify referrer
        try {
            await bot.sendMessage(referredBy, 
                `🎉 Great news! You earned ₹${REFERRAL_REWARD} for referring a new user!\n\n` +
                `💰 Your wallet balance: ₹${users[referredBy].walletBalance}\n` +
                `👥 Total referrals: ${users[referredBy].referrals.length}`
            );
        } catch (error) {
            console.error('Error notifying referrer:', error);
        }
    }
    
    await saveUsers(users);
    return user;
}

// Get user data
async function getUser(userId) {
    const users = await loadUsers();
    return users[userId] || null;
}

// Update user data
async function updateUser(userId, updates) {
    const users = await loadUsers();
    if (users[userId]) {
        users[userId] = { ...users[userId], ...updates };
        await saveUsers(users);
        return users[userId];
    }
    return null;
}

// Main menu keyboard
function getMainMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [{ text: '🔗 Get Referral Link' }, { text: '💰 Wallet' }],
                [{ text: '💳 Set UPI ID' }, { text: '❓ How to Use Bot' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

// Channel subscription keyboard
function getChannelKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Join Channel', url: 'https://t.me/synape' }],
                [{ text: '✅ I Joined', callback_data: 'check_subscription' }]
            ]
        }
    };
}

// Handle /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    
    // Extract referral code from start parameter
    const startParam = match[1].trim();
    let referredBy = null;
    
    if (startParam) {
        const users = await loadUsers();
        // Find user with this referral code
        for (const [uid, user] of Object.entries(users)) {
            if (user.referralCode === startParam && uid !== userId.toString()) {
                referredBy = uid;
                break;
            }
        }
    }
    
    // Check if user already exists
    let user = await getUser(userId);
    
    if (!user) {
        // Check channel subscription first
        const isSubscribed = await checkChannelSubscription(userId);
        
        if (!isSubscribed) {
            await bot.sendMessage(chatId, 
                `🌟 Welcome to SYNAPE EARN Bot!\n\n` +
                `To get started, please join our channel first:`,
                getChannelKeyboard()
            );
            return;
        }
        
        // Create new user
        user = await createUser(userId, username, firstName, referredBy);
        
        await bot.sendMessage(chatId, 
            `🎉 Welcome ${firstName}! You've successfully joined SYNAPE EARN!\n\n` +
            `🔗 Your referral code: ${user.referralCode}\n` +
            `💰 Current balance: ₹${user.walletBalance}\n\n` +
            `Use the menu below to navigate:`,
            getMainMenuKeyboard()
        );
    } else {
        // Existing user
        await bot.sendMessage(chatId, 
            `👋 Welcome back ${firstName}!\n\n` +
            `💰 Current balance: ₹${user.walletBalance}\n` +
            `👥 Total referrals: ${user.referrals.length}\n\n` +
            `Use the menu below to navigate:`,
            getMainMenuKeyboard()
        );
    }
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    if (data === 'check_subscription') {
        const isSubscribed = await checkChannelSubscription(userId);
        
        if (isSubscribed) {
            // Create user account
            const username = callbackQuery.from.username;
            const firstName = callbackQuery.from.first_name;
            
            const user = await createUser(userId, username, firstName);
            
            await bot.editMessageText(
                `✅ Subscription verified!\n\n` +
                `🎉 Welcome ${firstName}! You've successfully joined SYNAPE EARN!\n\n` +
                `🔗 Your referral code: ${user.referralCode}\n` +
                `💰 Current balance: ₹${user.walletBalance}`,
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id
                }
            );
            
            await bot.sendMessage(chatId, 
                `Use the menu below to navigate:`,
                getMainMenuKeyboard()
            );
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '❌ Please join the channel first!',
                show_alert: true
            });
        }
    }
});

// Handle text messages
bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text;
        
        // Check if user exists and is subscribed
        const user = await getUser(userId);
        if (!user) {
            await bot.sendMessage(chatId, 
                `Please start the bot first by typing /start`,
                getChannelKeyboard()
            );
            return;
        }
        
        // Verify subscription
        const isSubscribed = await checkChannelSubscription(userId);
        if (!isSubscribed) {
            await bot.sendMessage(chatId, 
                `❌ You need to be subscribed to our channel to use this bot.`,
                getChannelKeyboard()
            );
            return;
        }
        
        switch (text) {
            case '🔗 Get Referral Link':
                const referralLink = `https://t.me/synapeearn_bot?start=${user.referralCode}`;
                await bot.sendMessage(chatId, 
                    `🔗 Your Referral Link:\n\n` +
                    `${referralLink}\n\n` +
                    `📢 Share this link with friends!\n` +
                    `💰 Earn ₹${REFERRAL_REWARD} for each successful referral!\n\n` +
                    `📊 Your Stats:\n` +
                    `👥 Total Referrals: ${user.referrals.length}\n` +
                    `💰 Total Earned: ₹${user.walletBalance}`
                );
                break;
                
            case '💰 Wallet':
                const withdrawButton = user.walletBalance >= MIN_WITHDRAWAL ? 
                    [[{ text: '💸 Request Withdrawal', callback_data: 'request_withdrawal' }]] : [];
                
                await bot.sendMessage(chatId, 
                    `💰 Your Wallet\n\n` +
                    `💵 Balance: ₹${user.walletBalance}\n` +
                    `👥 Total Referrals: ${user.referrals.length}\n` +
                    `💰 Earned from Referrals: ₹${user.referrals.length * REFERRAL_REWARD}\n\n` +
                    `${user.walletBalance >= MIN_WITHDRAWAL ? 
                        '✅ You can request withdrawal!' : 
                        `❌ Minimum withdrawal: ₹${MIN_WITHDRAWAL}`}\n` +
                    `${user.upiId ? `💳 UPI ID: ${user.upiId}` : '❌ UPI ID not set'}`,
                    {
                        reply_markup: {
                            inline_keyboard: withdrawButton
                        }
                    }
                );
                break;
                
            case '💳 Set UPI ID':
                await bot.sendMessage(chatId, 
                    `💳 Please enter your UPI ID:\n\n` +
                    `Example: yourname@paytm, yourname@phonepe, etc.\n\n` +
                    `⚠️ Make sure your UPI ID is correct as payments will be sent to this ID.`
                );
                
                // Wait for UPI ID input
                const upiListener = (upiMsg) => {
                    if (upiMsg.chat.id === chatId && upiMsg.from.id === userId && upiMsg.text) {
                        const upiId = upiMsg.text.trim();
                        
                        // Basic UPI ID validation
                        if (upiId.includes('@') && upiId.length > 5) {
                            updateUser(userId, { upiId: upiId });
                            bot.sendMessage(chatId, 
                                `✅ UPI ID updated successfully!\n\n` +
                                `💳 Your UPI ID: ${upiId}`
                            );
                        } else {
                            bot.sendMessage(chatId, 
                                `❌ Invalid UPI ID format. Please try again with a valid UPI ID.`
                            );
                        }
                        
                        bot.removeListener('message', upiListener);
                    }
                };
                
                bot.on('message', upiListener);
                break;
                
            case '❓ How to Use Bot':
                await bot.sendMessage(chatId, 
                    `📖 How to Use SYNAPE EARN Bot\n\n` +
                    `1️⃣ **Get Your Referral Link**\n` +
                    `   • Click "Get Referral Link" to get your unique link\n` +
                    `   • Share this link with friends and family\n\n` +
                    `2️⃣ **Earn Money**\n` +
                    `   • Earn ₹${REFERRAL_REWARD} for each person who joins through your link\n` +
                    `   • They must join our channel to complete the referral\n\n` +
                    `3️⃣ **Set UPI ID**\n` +
                    `   • Add your UPI ID for receiving payments\n` +
                    `   • Make sure it's correct!\n\n` +
                    `4️⃣ **Withdraw Money**\n` +
                    `   • Minimum withdrawal: ₹${MIN_WITHDRAWAL}\n` +
                    `   • Request withdrawal from your wallet\n` +
                    `   • Admin will process within 24-48 hours\n\n` +
                    `💡 **Tips:**\n` +
                    `• Share your link on social media\n` +
                    `• Tell friends about earning opportunities\n` +
                    `• Be patient - earnings grow over time!\n\n` +
                    `📢 Channel: ${CHANNEL_USERNAME}\n` +
                    `🤖 Bot: @synapeearn_bot`,
                    { parse_mode: 'Markdown' }
                );
                break;
        }
    }
});

// Handle withdrawal requests
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    if (data === 'request_withdrawal') {
        const user = await getUser(userId);
        
        if (!user) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: 'User not found!',
                show_alert: true
            });
            return;
        }
        
        if (user.walletBalance < MIN_WITHDRAWAL) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`,
                show_alert: true
            });
            return;
        }
        
        if (!user.upiId) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: 'Please set your UPI ID first!',
                show_alert: true
            });
            return;
        }
        
        // Create withdrawal request
        const withdrawals = await loadWithdrawals();
        const withdrawalRequest = {
            id: uuidv4(),
            userId: userId,
            username: user.username,
            firstName: user.firstName,
            amount: user.walletBalance,
            upiId: user.upiId,
            requestedAt: new Date().toISOString(),
            status: 'pending'
        };
        
        withdrawals.push(withdrawalRequest);
        await saveWithdrawals(withdrawals);
        
        // Reset user balance
        await updateUser(userId, { walletBalance: 0 });
        
        await bot.editMessageText(
            `✅ Withdrawal request submitted!\n\n` +
            `💰 Amount: ₹${withdrawalRequest.amount}\n` +
            `💳 UPI ID: ${withdrawalRequest.upiId}\n` +
            `📅 Requested: ${new Date().toLocaleDateString()}\n\n` +
            `⏳ Your request is being processed.\n` +
            `You'll receive payment within 24-48 hours.`,
            {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id
            }
        );
        
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Withdrawal request submitted successfully!',
            show_alert: false
        });
    }
});

// Error handling
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// Initialize and start bot
async function startBot() {
    await initializeData();
    console.log('🤖 SYNAPE EARN Bot started successfully!');
    console.log('📢 Channel:', CHANNEL_USERNAME);
    console.log('💰 Referral reward: ₹' + REFERRAL_REWARD);
    console.log('💸 Minimum withdrawal: ₹' + MIN_WITHDRAWAL);
}

startBot();

module.exports = bot;

