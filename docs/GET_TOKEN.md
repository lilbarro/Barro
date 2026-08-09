# 🔑 How to Get Your Discord Token

## ⚠️ **IMPORTANT WARNING**

- **NEVER share your Discord token with anyone!**
- **Selfbots violate Discord's Terms of Service**
- **Your account may be terminated if detected**
- **Use at your own risk**
- **⚠️ AVOID BlueCord and Suspicious Clients - They may be known malware and a security risk!**
- **Avoid downloading suspicious token grabber apps - Use browser methods instead**

---

## 📱 **Method 1: Mobile (Kiwi Browser - Developer Tools)**

### **What is Kiwi Browser?**

Kiwi Browser is a Chromium-based browser that supports built-in Developer Tools on Android, allowing safe token extraction through the browser console.

### **Steps:**

1. **Install & Log In**

   - Download Kiwi Browser from the Google Play Store
   - Go to https://discord.com/app and log in to your account

2. **Enable Desktop Site**

   - Tap the three dots (menu) in the top-right corner
   - Check the box for **"Desktop site"**
   - This is necessary for the web app to load correctly

3. **Open Developer Tools**

   - Tap the three dots (menu) again
   - Scroll down and select **"Developer tools"**

4. **Find the Token via Application Tab**

   - In the Developer Tools window, find the top bar and select **"Application"**
   - On the left sidebar, expand **"Local Storage"** and select `https://discord.com`
   - In the "Filter" box on the right, type `token`
   - Your token will appear next to the key labeled `token` (a long string of characters wrapped in quotes)

5. **Alternative (Network Tab)**

   - If it doesn't show in Local Storage, go to the **"Network"** tab
   - Refresh the page or switch to a different channel to trigger activity
   - Look for a request named `library` or `messages?limit=50`
   - Tap it, go to **"Headers"**, and scroll down to **"Request Headers"**
   - Your token is the value next to the `authorization` header

6. **Use Token**
   - Paste the token into your `config.yaml` file
   - Replace `"YOUR_DISCORD_TOKEN_HERE"` with your actual token

---

## 💻 **Method 2: Desktop/Browser Console**

### **Using Discord Desktop App:**

1. **Open Discord Desktop App**

   - Launch the Discord desktop application
   - Login to your account

2. **Open Developer Console**

   - Press `Ctrl + Shift + I` (Windows/Linux) or `Cmd + Option + I` (Mac)
   - Click on the **"Console"** tab

3. **Run Token Extraction Code**
   - Copy and paste this code into the console:

```javascript
window.webpackChunkdiscord_app.push([
  [Symbol()],
  {},
  (req) => {
    if (!req.c) return;
    for (let m of Object.values(req.c)) {
      try {
        if (!m.exports || m.exports === window) continue;
        if (m.exports?.getToken) return copy(m.exports.getToken());
        for (let ex in m.exports) {
          if (
            m.exports?.[ex]?.getToken &&
            m.exports[ex][Symbol.toStringTag] !== "IntlMessagesProxy"
          )
            return copy(m.exports[ex].getToken());
        }
      } catch {}
    }
  },
]);
window.webpackChunkdiscord_app.pop();
console.log("%cWorked!", "font-size: 50px");
console.log(`%cYou now have your token in the clipboard!`, "font-size: 16px");
```

4. **Press Enter**

   - The code will run and copy your token to clipboard
   - You should see "Worked!" message in console

5. **Use Token**
   - Paste the token into your `config.yaml` file
   - Replace `"YOUR_DISCORD_TOKEN_HERE"` with your actual token

### **Using Web Browser:**

1. **Open Discord in Browser**

   - Go to https://discord.com/app
   - Login to your account

2. **Open Developer Tools**

   - Press `F12` or `Ctrl + Shift + I`
   - Click on the **"Console"** tab

3. **Run the Same Code**
   - Paste the same JavaScript code as above
   - Press Enter and copy the token

---

## 🔍 **Method 3: Network Tab (Advanced)**

### **Steps:**

1. **Open Discord in Browser**

   - Go to https://discord.com/app
   - Login to your account

2. **Open Developer Tools**

   - Press `F12`
   - Click on the **"Network"** tab

3. **Filter Requests**

   - In the filter box, type: `api/v`
   - This will show only Discord API requests

4. **Send a Message**

   - Send any message in any channel
   - This will trigger API requests

5. **Find Authorization Header**
   - Click on any API request in the Network tab
   - Look for **"Request Headers"**
   - Find the **"authorization"** header
   - Copy the value (this is your token)

---

## 📲 **Method 4: Mobile Browser**

### **Steps:**

1. **Open Mobile Browser**

   - Use Chrome, Firefox, or Safari on your phone
   - Go to https://discord.com/app

2. **Enable Desktop Mode**

   - In browser settings, enable "Desktop Site" or "Request Desktop Site"
   - This allows access to developer tools

3. **Open Developer Console**

   - Look for browser menu → "Developer Tools" or "Inspect"
   - Navigate to Console tab

4. **Run Token Code**
   - Paste the JavaScript code from Method 2
   - Copy the extracted token

---

## 🛠️ **Method 5: Discord Token Grabber Tools**

### **⚠️ WARNING: Use with Extreme Caution**

- Many token grabber tools are **malicious**
- They may steal your token or install malware
- **Only use trusted, open-source tools**
- **Scan with antivirus before running**

### **Safer Alternatives:**

- Use the browser console method instead
- It's safer and doesn't require downloading suspicious software

---

## 📝 **How to Use Your Token**

### **1. Open config.yaml**

```yaml
selfbot:
  token: "YOUR_DISCORD_TOKEN_HERE" # Replace this
  prefix: "+"
  status: "dnd"
```

### **2. Replace the Token**

```yaml
selfbot:
  token: "MTEzMjMzODI6DS2MTU1MDYwMw.GqP4rF._h9jUzBCHUynjvdvi76t1sYQRhy1ezYEkz2o3SC"
  prefix: "+"
  status: "dnd"
```

### **3. Save and Start Bot**

- Save the config.yaml file
- Run: `node index.js`
- Your selfbot should now login successfully

---

## 🔒 **Security Tips**

### **Protect Your Token:**

- **Never share it** in Discord servers, GitHub, or anywhere public
- **Don't paste it** in untrusted websites or tools
- **Use environment variables** for extra security (advanced)
- **Regenerate token** if you suspect it's compromised


### **If Your Token is Compromised:**

1. **Change your Discord password immediately**
2. **Enable 2FA** if not already enabled
3. **Check for unauthorized activity**
4. **Consider creating a new account** for selfbot use

---

## ❓ **Troubleshooting**

### **Token Not Working?**

- **Check format**: Token should be long string with dots
- **No extra spaces**: Remove any spaces before/after token
- **Quotes required**: Keep the token in double quotes
- **Account locked**: Your account might be temporarily locked

### **Console Code Not Working?**

- **Try refreshing** Discord and running code again
- **Different browser**: Try Chrome, Firefox, or Edge
- **Desktop app**: Use desktop app instead of browser
- **Clear cache**: Clear browser cache and try again

### **Still Having Issues?**

- **Join our support server**: https://discord.gg/b3hZG4R7Mf
- **Contact developers**: `lilbarro` or `marcel4real`
- **Check GitHub issues**: https://github.com/lilbarro/Barro

---

## 📚 **Additional Resources**

### **Useful Links:**

- **Barro GitHub**: https://github.com/lilbarro/Barro
- **Support Server**: https://discord.gg/b3hZG4R7Mf
- **Discord Developer Portal**: https://discord.com/developers/applications

### **Alternative Methods:**

- **BetterDiscord plugins** (if you use BetterDiscord)
- **Discord.js token extractors** (for developers)
- **Browser extensions** (use with caution)

---

## ⚖️ **Legal Disclaimer**

- **Selfbots violate Discord's Terms of Service**
- **Account termination is possible**
- **Use at your own risk**
- **We are not responsible for any consequences**
- **This guide is for educational purposes only**

---

**Happy selfbotting! 🤖**

_Remember: Stay safe, Try using alt accounts, and don't get caught!_
