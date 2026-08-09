# Image Generator Guide

## What is ImageGen?

The `imagegen` command lets you create AI-generated images right in Discord! Just describe what you want, and our selfbot will create it for you.

**Powered by Pollinations.ai** - We use Pollinations.ai as our free image generation provider. Big thanks to them for making this possible! 🙏

## Quick Start

The simplest way to use it:

```
+imagegen a cute cat
```

That's it! The bot will generate an image of a cute cat for you.

## Basic Usage

### Command Aliases

You can use any of these commands:

- `+imagegen` (full command)
- `+img` (short version)
- `+generate`
- `+ai-image`
- `+pollinate`

### Simple Examples

```
+img sunset over mountains
+imagegen a dragon breathing fire
+enerate a magical forest
+i-image cyberpunk city at night
```

## Advanced Options

Want more control? Add these options to your command:

### Image Size

- `--width=1024` - Set how wide the image is (256 to 2048)
- `--height=1024` - Set how tall the image is (256 to 2048)

Example: `!img portrait --width=768 --height=1024`

### Quality Options

- `--enhance` - Makes better quality images (takes longer)
- `--nologo` - Removes the watermark
- `--model=flux` - Choose the AI model (flux is default)

Example: `+img beautiful landscape --enhance --nologo`

### Advanced Examples

```
+img warrior portrait --width=768 --height=1024 --enhance
+img space battle --width=1920 --height=1080 --nologo
+img cute puppy --enhance
```

## Writing Good Prompts

### Be Specific

❌ "car"
✅ "red sports car on highway"

### Add Style

- "anime style magical girl"
- "realistic portrait"
- "cartoon style robot"
- "oil painting of ocean"

### Include Details

- "golden hour lighting"
- "4K quality"
- "dark and moody"
- "bright and cheerful"

## Important Rules

- **Prompt Length**: Keep your description under 500 characters
- **Wait Time**: Wait about 8 seconds between requests
- **Generation Time**: Images take 5-30 seconds to create
- **File Size**: Images can be up to 8MB (Discord's limit)

## Common Issues

### "Rate limit exceeded"

Wait a few seconds and try again. The API gets busy sometimes.

### "Prompt too long"

Your description is over 500 characters. Make it shorter.

### "Generation failed"

Try a simpler prompt or smaller image size.

### "Request timed out"

The API is very busy. Wait a minute and try again.

## Tips for Better Results

1. **Be descriptive**: Instead of "dog", try "golden retriever puppy playing in grass"
2. **Add art styles**: "anime style", "realistic", "cartoon", "pixel art"
3. **Set the mood**: "dark fantasy", "bright and colorful", "mysterious"
4. **Include lighting**: "sunset lighting", "neon lights", "soft morning light"

## Need Help?

Type `+imagegen help` to see all options and examples right in Discord!

---

**Credits**: This feature is powered by [Pollinations.ai](https://pollinations.ai) - a free AI image generation service. Please support them! 💜
