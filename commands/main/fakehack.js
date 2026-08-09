import { log, wait } from "../../utils/functions.js";

export default {
  name: "fakehack",
  description: "Simulate hacking someone with a fake terminal output",
  aliases: ["hack", "fh"],
  usage: "<@user/userID>",
  category: "general",
  cooldown: 10,

  execute: async (client, message, args) => {
    try {
      // Security check - only allow the selfbot user to execute
      if (message.author.id !== client.user.id) return;

      // Check if a user is mentioned or ID is provided
      if (!args[0]) {
        return message.channel.send(
          "> ❌ Please mention a user or provide a user ID to hack."
        );
      }

      // Get the target user
      const targetUser = await getTargetUser(client, args[0]);

      // Send initial message
      const hackMessage = await message.channel.send(`> 🖥️ **HACK INITIATED ON ${targetUser.username.toUpperCase()}** 🖥️`);
      
      // Execute the fake hack sequence
      await executeHackSequence(hackMessage, targetUser);
      
      // Send completion message
      await message.channel.send(`> 🔓 **Hack complete!** ${targetUser.username} has been hacked!`);
      
      log(`Executed fake hack on ${targetUser.username}`, "debug");
    } catch (error) {
      log(`Error in fakehack command: ${error.message}`, "error");
      message.channel.send(`> ❌ An error occurred: ${error.message}`);
    }
  },
};

/**
 * Get target user from mention, ID, or username
 * @param {Client} client - Discord client
 * @param {string} input - User input (mention, ID, or username)
 * @returns {Object} Target user object
 */
async function getTargetUser(client, input) {
  try {
    let userId;
    
    // Check if it's a mention (like <@123456789012345678> or <@!123456789012345678>)
    const mentionMatch = input.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      userId = mentionMatch[1];
    } else if (/^\d+$/.test(input)) {
      // It's a raw ID
      userId = input;
    }
    
    // Try to fetch the user by ID
    if (userId) {
      try {
        const user = await client.users.fetch(userId, { force: true });
        return user;
      } catch (error) {
        // User not found, continue to search by username
      }
    }
    
    // Search by username in guilds
    const searchName = input.replace(/[<@!>]/g, "").toLowerCase();
    for (const guild of client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch();
        const foundMember = members.find(m => 
          m.user.username.toLowerCase() === searchName || 
          m.displayName.toLowerCase() === searchName
        );
        
        if (foundMember) {
          return foundMember.user;
        }
      } catch (error) {
        // Ignore errors for individual guilds
      }
    }
    
    // If user not found, create a fake user object
    return createFakeUser(input);
  } catch (error) {
    log(`Error fetching user: ${error.message}`, "error");
    return createFakeUser(input);
  }
}

/**
 * Create a fake user object
 * @param {string} input - Original input
 * @returns {Object} Fake user object
 */
function createFakeUser(input) {
  const username = input.replace(/[<@!>]/g, "");
  return {
    id: Math.floor(Math.random() * 1000000000000000000).toString(),
    username: username,
    tag: username + "#0000",
    createdAt: new Date()
  };
}

/**
 * Execute the fake hack sequence with progressive updates
 * @param {Message} hackMessage - The message to edit
 * @param {Object} targetUser - Target user object
 */
async function executeHackSequence(hackMessage, targetUser) {
  const steps = [
    { text: "[?] Initializing hack.exe...", color: "31", delay: 1500 },
    { text: "[✓] Connected to target system", color: "32", delay: 1500 },
    { text: "[!] Bypassing security...", color: "33", delay: 2000 },
    { text: "[✓] Security bypassed", color: "32", delay: 1800 },
    { text: "[!] Accessing account...", color: "33", delay: 2200 },
    { text: "[✓] Account accessed", color: "32", delay: 2500 },
    { text: "[!] Getting user data...", color: "33", delay: 2000 },
    { text: "[✓] User data acquired", color: "32", delay: 2300 },
    { text: "[!] Fetching Discord token...", color: "33", delay: 2100 },
    { text: `[✓] Token: ${generateFakeToken(targetUser.id)}`, color: "32", delay: 2000 },
    { text: "[!] Injecting malware...", color: "33", delay: 2300 },
    { text: "[✓] Malware injected", color: "32", delay: 2100 },
    { text: "[!] Finding IP address...", color: "33", delay: 2000 },
    { text: `[✓] IP: ${generateFakeIP()}`, color: "32", delay: 2000 },
    { text: "[!] Selling data to dark web...", color: "33", delay: 2100 },
    { text: `[✓] Data sold for ${Math.floor(Math.random() * 100) + 10} BTC`, color: "32", delay: 2000 },
    { text: "[!] Finalizing hack...", color: "33", delay: 1500 },
    { text: "[✓] Hack completed", color: "32", delay: 0 }
  ];
  
  let output = [];
  
  for (const step of steps) {
    if (step.delay > 0) {
      await wait(step.delay);
    }
    
    // Add current step to output
    output.push(`\u001b[2;${step.color}m${step.text}\u001b[0m`);
    
    // Create the ANSI code block
    const content = `> \`\`\`ansi\n> ${output.join('\n> ')}\n> \`\`\``;
    
    await hackMessage.edit(content);
  }
}

/**
 * Generate a fake Discord token based on user ID
 * @param {string} userId - Discord user ID
 * @returns {string} Fake token
 */
function generateFakeToken(userId) {
  // First part: User ID encoded in Base64
  const idPart = Buffer.from(userId).toString('base64');
  
  // Second part: Random timestamp
  const timestampPart = Buffer.from(Date.now().toString()).toString('base64').substring(0, 6);
  
  // Third part: Random string
  const randomPart = Array(27).fill(0).map(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }).join('');
  
  // Combine all parts
  return `${idPart}.${timestampPart}.${randomPart}`;
}

/**
 * Generate a fake IP address
 * @returns {string} Fake IP address
 */
function generateFakeIP() {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}