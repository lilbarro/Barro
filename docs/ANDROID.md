# 📱 Running Barro Selfbot on Android (Termux)

## ⚠️ **IMPORTANT DISCLAIMER**

### **🚨 Android is NOT Recommended for 24/7 Selfbots**

- **Battery optimization** will kill the process frequently
- **Background app limits** prevent continuous operation
- **Unreliable connection** due to mobile network switching
- **Performance issues** on lower-end devices
- **Cannot run 24/7** like a proper server

### **🏆 Recommended Alternatives:**

- **VPS Hosting** (DigitalOcean, Linode, Vultr) - $5-10/month
- **Cloud Hosting** (AWS, Google Cloud, Azure) - Pay as you use
- **Dedicated Server** - For serious 24/7 operation
- **Home Server/PC** - Reliable and always-on

**Use Android only for testing or temporary usage!**

---

## 📋 **Prerequisites**

### **What You Need:**

- **Android device** (Android 7.0+ recommended)
- **Stable internet connection** (WiFi preferred)
- **At least 2GB RAM** (4GB+ recommended)
- **2GB+ free storage space**
- **Termux app** (terminal emulator)
- **Your Discord token** (see [GET_TOKEN.md](GET_TOKEN.md))

---

## 🛠️ **Step 1: Install Termux**

### **Download Termux:**

1. **F-Droid (Recommended)**:

   - Download Termux from: https://f-droid.org/en/packages/com.termux
   - Install Termux APK

2. **GitHub (Alternative)**:

   - Go to: https://github.com/termux/termux-app
   - Download latest APK from releases
   - Install the APK

3. **⚠️ Avoid Google Play Store**:
   - Play Store version is outdated and broken
   - Use F-Droid or GitHub instead

### **Grant Permissions:**

- Open Termux
- Allow storage access when prompted
- Grant notification permissions

---

## 🔧 **Step 2: Setup Termux Environment**

### **Update Package Lists:**

```bash
pkg update && pkg upgrade -y
```

### **Install Essential Packages:**

```bash
pkg install -y git nodejs npm python
```

### **Setup Storage Access:**

```bash
termux-setup-storage
```

### **Install Additional Tools:**

```bash
pkg install -y curl wget nano vim
```

---

## 📦 **Step 3: Install Node.js and npm**

### **Verify Installation:**

```bash
node --version
npm --version
```

### **If Node.js is Outdated:**

```bash
pkg install -y nodejs-lts
```

---

## 📥 **Step 4: Get Barro Repository**

### **Option 1: Git Clone (Recommended)**

```bash
cd ~

git clone https://github.com/lilbarro/Barro.git

cd Barro
```

### **Option 2: Download ZIP (If git clone fails)**

If `git clone` doesn't work on your Android device:
1. **Open your mobile browser** and go to: https://github.com/lilbarro/Barro
2. **Tap** the green **"Code"** button at the top
3. **Select** "Download ZIP"
4. **Save** the ZIP file to your device
5. **Extract** the ZIP file using your file manager or archive app
6. **Move** the extracted folder to your Termux home directory:
   ```bash
   # Navigate to where you extracted the files
   cd /sdcard/Download  # or wherever you saved it
   
   # Move the Barro folder to Termux home
   mv Barro-main ~/Barro
   cd ~/Barro
   ```

**Both methods work the same way!** 🎯

### **Verify Files:**

```bash
# List files to ensure everything downloaded
ls -la

# You should see: config.yaml, index.js, package.json, etc.
```

---

## 📦 **Step 5: Install Dependencies**

### **Install npm Packages:**

```bash
# Install all required dependencies
npm install
```

### **If Installation Fails:**

```bash
# Clear npm cache and try again
npm cache clean --force
npm install --no-optional
```


---

## ⚙️ **Step 6: Configure the Selfbot**

### **Edit Configuration:**

```bash
# Open config file with nano editor
nano config.yaml
```

### **Essential Settings:**

```yaml
selfbot:
  token: "YOUR_DISCORD_TOKEN_HERE" # Replace with your token
  prefix: "+"
  status: "dnd"

# Disable resource-intensive features for mobile
rich_presence:
  enabled: false # Disable to save resources

debug_mode:
  enabled: false # Disable debug logs

# Reduce rate limits for mobile
vc_command:
  auto_reconnect: false # Disable auto-reconnect
```

### **Save and Exit:**

- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

## 🚀 **Step 7: Run the Selfbot**

### **Start the Bot:**

```bash
# Run the selfbot
node index.js
```

### **Expected Output:**

```
[INFO] Loading configuration...
[INFO] Validating Discord token...
[INFO] Initializing Discord client...
[SUCCESS] Successfully connected to Discord!
[SUCCESS] Barro is ready with X commands
```

### **Test Commands:**

```bash
# In Discord, test with:
,help
,ping
,userinfo
```

---

## 🔄 **Step 8: Keep Bot Running (Background)**

### **Using Screen (Recommended):**

```bash
# Install screen
pkg install -y screen

# Start a new screen session
screen -S Barro

# Run the bot inside screen
node index.js

# Detach from screen: Ctrl + A, then D
# Reattach later: screen -r Barro
```

### **Using nohup (Alternative):**

```bash
# Run bot in background
nohup node index.js > bot.log 2>&1 &

# Check if running
ps aux | grep node

# View logs
tail -f bot.log
```

---

## 🔋 **Step 9: Battery Optimization (Critical)**

### **Disable Battery Optimization:**

1. **Android Settings** → **Apps** → **Termux**
2. **Battery** → **Battery Optimization**
3. **Select "Don't optimize"** for Termux
4. **Background App Refresh** → **Allow**

### **Keep Screen On (Optional):**

```bash
# In Termux, prevent sleep
termux-wake-lock
```

### **Auto-start on Boot (Advanced):**

```bash
# Install Termux:Boot from F-Droid
# Create startup script in ~/.termux/boot/
mkdir -p ~/.termux/boot
echo "cd ~/Barro && node index.js" > ~/.termux/boot/start-bot
chmod +x ~/.termux/boot/start-bot
```

---

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **"Cannot find module" Error:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **"Permission denied" Error:**

```bash
# Fix permissions
chmod +x index.js
termux-setup-storage
```

#### **"Token invalid" Error:**

- Check your token in config.yaml
- Ensure no extra spaces or characters
- Get a fresh token (see GET_TOKEN.md)

#### **Bot Keeps Stopping:**

- Use `screen` or `nohup` to run in background
- Disable battery optimization for Termux
- Keep device plugged in and connected to WiFi

#### **High Memory Usage:**

```bash
# Monitor memory usage
free -h
top

# Reduce memory usage in config:
# - Disable rich_presence
# - Disable debug_mode
# - Reduce command cooldowns
```

---

## 📊 **Performance Tips**

### **Optimize for Mobile:**

```yaml
# In config.yaml, use these settings:
debug_mode:
  enabled: false

rich_presence:
  enabled: false

relationship_logs:
  enabled: false
# Increase cooldowns to reduce CPU usage
# Most commands have cooldown: 3-5 seconds
```

### **Monitor Resources:**

```bash
# Check CPU and memory usage
top

# Check disk space
df -h

# Check network usage
pkg install -y nethogs
sudo nethogs
```

---

## 🌐 **Better Hosting Alternatives**

### **🏆 Recommended VPS Providers:**

#### **1. DigitalOcean**

- **Price**: $5-10/month
- **Features**: SSD storage, 24/7 uptime
- **Setup**: 1-click Node.js droplet
- **Link**: https://digitalocean.com

#### **2. Vultr**

- **Price**: $2.50-6/month
- **Features**: Global locations, fast SSD
- **Setup**: Ubuntu + Node.js
- **Link**: https://vultr.com

#### **3. Linode**

- **Price**: $5-10/month
- **Features**: Reliable, good support
- **Setup**: Nanode instances
- **Link**: https://linode.com

#### **4. Contabo**

- **Price**: $4-8/month
- **Features**: High RAM, good value
- **Setup**: VPS with Ubuntu
- **Link**: https://contabo.com

### **🆓 Free Alternatives (Limited):**

#### **1. Oracle Cloud (Free Tier)**

- **Price**: Free forever
- **Limits**: 1GB RAM, limited CPU
- **Good for**: Testing and light usage

#### **2. Google Cloud (Free Trial)**

- **Price**: $300 credit for 90 days
- **After trial**: Pay as you use
- **Good for**: Short-term projects

#### **3. Heroku (Discontinued)**

- **Status**: No longer offers free tier
- **Alternative**: Use Railway or Render

---

## 📱 **Android-Specific Commands**

### **Termux Utilities:**

```bash
# Check battery status
termux-battery-status

# Get device info
termux-info

# Take screenshot
termux-camera-photo ~/screenshot.jpg

# Send notification
termux-notification -t "Bot Status" -c "Selfbot is running"

# Keep device awake
termux-wake-lock

# Release wake lock
termux-wake-unlock
```

### **System Monitoring:**

```bash
# Monitor bot process
ps aux | grep node

# Kill bot process
pkill -f "node index.js"

# Restart bot
cd ~/Barro && node index.js
```

---

## 🔐 **Security Considerations**

### **Protect Your Token:**

- **Never share** your config.yaml file
- **Use environment variables** for extra security:

```bash
# Set token as environment variable
export DISCORD_TOKEN="your_token_here"

# Modify index.js to use process.env.DISCORD_TOKEN
```

### **Network Security:**

- **Use WiFi** instead of mobile data when possible
- **Avoid public WiFi** for sensitive operations
- **Consider VPN** for additional privacy

---

## 📞 **Support**

### **Need Help?**

- **Discord Server**: https://discord.gg/b3hZG4R7Mf
- **GitHub Issues**: https://github.com/lilbarro/Barro/issues
- **Developers**: `lilbarro` or `marcel4real`

### **Before Asking for Help:**

1. **Check this guide** thoroughly
2. **Read error messages** carefully
3. **Try troubleshooting steps** above
4. **Provide error logs** when asking for help

---

## ⚖️ **Final Warnings**

### **Legal and Safety:**

- **Selfbots violate Discord ToS** - account termination risk
- **Use alt accounts** - never your main account
- **Android is unreliable** for 24/7 operation
- **VPS hosting is strongly recommended** for serious use

### **Performance Expectations:**

- **Expect interruptions** due to Android limitations
- **Battery drain** will be significant
- **Network switching** may cause disconnections
- **Background limits** will kill the process

### **When to Use Android:**

- ✅ **Testing and development**
- ✅ **Temporary usage**
- ✅ **Learning and experimentation**
- ❌ **24/7 production selfbots**
- ❌ **Critical or important operations**

---

**Remember: Android is for testing only. Get proper VPS hosting for serious selfbot usage! 🚀**
