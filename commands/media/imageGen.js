import axios from "axios";
import { truncate } from "../../utils/functions.js";

export default {
  name: "imagegen",
  aliases: ["img", "generate", "ai-image", "pollinate"],
  description: "Generate AI images using Pollinations.ai",
  usage:
    "imagegen <prompt> [--model=flux] [--width=1024] [--height=1024] [--enhance] [--nologo]",
  category: "media",
  type: "both",
  permissions: ["SendMessages", "AttachFiles"],
  cooldown: 60, // Higher cooldown due to API rate limits

  async execute(client, message, args) {
    const prompt = args.join(" ");

    // Show help if requested or no prompt provided
    if (
      !prompt ||
      prompt.toLowerCase() === "help" ||
      prompt.toLowerCase() === "--help"
    ) {
      return this.showHelp(client, message);
    }

    // Limit prompt length to prevent abuse
    if (prompt.length > 500) {
      return message.channel.send(
        "❌ Prompt is too long! Please keep it under 500 characters.\n" +
          `**Current length:** ${prompt.length} characters`
      );
    }

    // Parse optional parameters
    const params = this.parseParameters(prompt);
    const cleanPrompt = params.prompt;

    // Validate dimensions
    if (params.width > 2048 || params.height > 2048) {
      return message.channel.send(
        "❌ Maximum image dimensions are 2048x2048 pixels!"
      );
    }

    if (params.width < 256 || params.height < 256) {
      return message.channel.send(
        "❌ Minimum image dimensions are 256x256 pixels!"
      );
    }

    // Send initial message
    const statusMsg = await message.channel.send(
      "🎨 **Generating image...**\n" +
        `**Prompt:** ${truncate(cleanPrompt, 100)}\n` +
        `**Model:** ${params.model}\n` +
        `**Size:** ${params.width}x${params.height}\n` +
        "⏳ This may take a few seconds..."
    );

    try {
      // Build the API URL
      const encodedPrompt = encodeURIComponent(cleanPrompt);
      const apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

      // Build query parameters
      const queryParams = new URLSearchParams({
        model: params.model,
        width: params.width.toString(),
        height: params.height.toString(),
        seed: params.seed,
        nologo: params.nologo.toString(),
        private: "false",
        enhance: params.enhance.toString(),
        safe: "true", // Keep it safe for Discord
      });

      const fullUrl = `${apiUrl}?${queryParams.toString()}`;

      // Make the request with timeout
      const response = await axios.get(fullUrl, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 second timeout
        headers: {
          "User-Agent": "Barro-Selfbot/1.0",
        },
      });

      // Check if we got a valid image
      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      // Create buffer from response
      const imageBuffer = Buffer.from(response.data);

      // Validate image size (Discord has 8MB limit)
      if (imageBuffer.length > 8 * 1024 * 1024) {
        throw new Error("Generated image is too large for Discord (>8MB)");
      }

      // Update status message and send image
      await statusMsg.edit(
        "✅ **Image generated successfully!**\n" +
          `**Prompt:** ${truncate(cleanPrompt, 100)}\n` +
          `**Model:** ${params.model} | **Size:** ${params.width}x${params.height}\n` +
          `**File size:** ${(imageBuffer.length / 1024).toFixed(1)} KB`
      );

      // Send the image
      await message.channel.send({
        files: [
          {
            attachment: imageBuffer,
            name: `generated_${Date.now()}.jpg`,
            description: truncate(cleanPrompt, 100),
          },
        ],
      });
    } catch (error) {
      console.error("Image generation error:", error);

      let errorMessage = "❌ **Failed to generate image!**\n";

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage +=
          "**Reason:** Request timed out. The API might be busy, try again later.";
      } else if (error.response?.status === 429) {
        errorMessage +=
          "**Reason:** Rate limit exceeded. Please wait a moment before trying again.";
      } else if (error.response?.status >= 500) {
        errorMessage +=
          "**Reason:** Pollinations.ai server error. Please try again later.";
      } else if (error.message.includes("too large")) {
        errorMessage += "**Reason:** Generated image is too large for Discord.";
      } else {
        errorMessage += `**Reason:** ${
          error.message || "Unknown error occurred"
        }`;
      }

      errorMessage +=
        "\n\n**Tips:**\n" +
        "• Try a simpler prompt\n" +
        "• Use smaller dimensions\n" +
        "• Wait a few seconds between requests";

      await statusMsg.edit(errorMessage);
    }
  },

  parseParameters(input) {
    const params = {
      prompt: input,
      model: "flux",
      width: 1024,
      height: 1024,
      seed: "random",
      nologo: false,
      enhance: false,
    };

    // Extract parameters from prompt
    let cleanPrompt = input;

    // Model parameter
    const modelMatch = input.match(/--model[=\s](\w+)/i);
    if (modelMatch) {
      params.model = modelMatch[1].toLowerCase();
      cleanPrompt = cleanPrompt.replace(/--model[=\s]\w+/i, "").trim();
    }

    // Width parameter
    const widthMatch = input.match(/--width[=\s](\d+)/i);
    if (widthMatch) {
      params.width = Math.min(2048, Math.max(256, parseInt(widthMatch[1])));
      cleanPrompt = cleanPrompt.replace(/--width[=\s]\d+/i, "").trim();
    }

    // Height parameter
    const heightMatch = input.match(/--height[=\s](\d+)/i);
    if (heightMatch) {
      params.height = Math.min(2048, Math.max(256, parseInt(heightMatch[1])));
      cleanPrompt = cleanPrompt.replace(/--height[=\s]\d+/i, "").trim();
    }

    // Seed parameter
    const seedMatch = input.match(/--seed[=\s](\w+)/i);
    if (seedMatch) {
      params.seed = seedMatch[1];
      cleanPrompt = cleanPrompt.replace(/--seed[=\s]\w+/i, "").trim();
    }

    // Boolean flags
    if (input.includes("--nologo")) {
      params.nologo = true;
      cleanPrompt = cleanPrompt.replace(/--nologo/i, "").trim();
    }

    if (input.includes("--enhance")) {
      params.enhance = true;
      cleanPrompt = cleanPrompt.replace(/--enhance/i, "").trim();
    }

    // Clean up extra spaces
    params.prompt = cleanPrompt.replace(/\s+/g, " ").trim();

    return params;
  },

  showHelp(client, message) {
    const helpEmbed = `🎨 **AI Image Generator - Complete Guide**

**🚀 Quick Start:**
\`${client.prefix}imagegen a cute cat\`
\`${client.prefix}img sunset over mountains\`

**📝 Basic Examples:**
• \`${client.prefix}imagegen a dragon breathing fire\`
• \`${client.prefix}img cyberpunk city at night\`
• \`${client.prefix}generate a magical forest with glowing trees\`
• \`${client.prefix}ai-image abstract art with vibrant colors\`

**⚙️ Advanced Options:**
• \`--width=1024\` - Set image width (256-2048)
• \`--height=1024\` - Set image height (256-2048)
• \`--model=flux\` - Choose AI model
• \`--enhance\` - Better quality (slower)
• \`--nologo\` - Remove watermark
• \`--seed=123\` - Same seed = same result

**🎯 Advanced Examples:**
\`${client.prefix}img portrait of a warrior --width=768 --height=1024 --enhance\`
\`${client.prefix}img space battle --width=1920 --height=1080 --nologo\`
\`${client.prefix}img cute puppy --seed=42 --enhance\`

**💡 Pro Tips:**
✅ **Be specific:** "red sports car on highway" vs "car"
✅ **Add style:** "anime style", "realistic", "cartoon"
✅ **Set mood:** "dark and moody", "bright and cheerful"
✅ **Include details:** "golden hour lighting", "4K quality"

**🎨 Style Examples:**
• \`anime style magical girl with pink hair\`
• \`realistic portrait of an elderly wizard\`
• \`cartoon style funny robot dancing\`
• \`oil painting of a stormy ocean\`
• \`pixel art of a medieval castle\`

**⚠️ Important Notes:**
• Max prompt length: 500 characters
• Generation takes 5-30 seconds
• Wait 8 seconds between requests
• Images are up to 8MB (Discord limit)

**🔧 Troubleshooting:**
• **"Rate limit"** → Wait a few seconds, try again
• **"Too long"** → Shorten your prompt
• **"Failed"** → Try simpler prompt or smaller size
• **"Timeout"** → API is busy, retry in a minute

**Need more help?** Just ask on github issues or support server! 😊`;

    return message.channel.send(helpEmbed);
  },
};
