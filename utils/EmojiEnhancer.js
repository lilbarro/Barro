import { log } from "./functions.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmojiEnhancer {
  constructor() {
    this.tempDir = path.join(__dirname, "..", "temp");
    this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists
   */
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Main enhancement function
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {boolean} isAnimated - Whether the image is animated
   * @returns {Promise<Buffer>} - Enhanced image buffer
   */
  async enhanceImage(imageBuffer, isAnimated = false) {
    try {
      // Skip enhancement for animated images (complex to process)
      if (isAnimated) {
        log("Skipping enhancement for animated image", "debug");
        return imageBuffer;
      }

      // Skip enhancement for large images (already good quality)
      if (imageBuffer.length > 100000) {
        // 100KB
        log("Skipping enhancement for large image", "debug");
        return imageBuffer;
      }

      log("Starting image enhancement process", "debug");

      // Try UpscalerJS first (primary method)
      try {
        const enhanced = await this.enhanceWithUpscalerJS(imageBuffer);
        if (enhanced) {
          log("Image enhanced successfully with UpscalerJS", "debug");
          return enhanced;
        }
      } catch (error) {
        log(`UpscalerJS enhancement failed: ${error.message}`, "debug");
      }

      // Try Pixteroid as fallback
      try {
        const enhanced = await this.enhanceWithPixteroid(imageBuffer);
        if (enhanced) {
          log("Image enhanced successfully with Pixteroid", "debug");
          return enhanced;
        }
      } catch (error) {
        log(`Pixteroid enhancement failed: ${error.message}`, "debug");
      }

      // If both methods fail, return original
      log("All enhancement methods failed, returning original image", "warn");
      return imageBuffer;
    } catch (error) {
      log(`Error in image enhancement: ${error.message}`, "error");
      return imageBuffer;
    }
  }

  /**
   * Enhance image using UpscalerJS with ESRGAN-thick model
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Promise<Buffer|null>} - Enhanced image buffer or null
   */
  async enhanceWithUpscalerJS(imageBuffer) {
    try {
      log("Attempting enhancement with UpscalerJS", "debug");

      // Import UpscalerJS and ESRGAN model
      const Upscaler = (await import("upscaler")).default;
      const x4 = (await import("@upscalerjs/esrgan-thick/4x")).default;

      // Create upscaler instance with 4x ESRGAN model
      const upscaler = new Upscaler({
        model: x4,
        patchSize: 64, // Smaller patches for better CPU performance
        padding: 2,
      });

      // Convert buffer to base64 data URL
      const mimeType = this.detectImageType(imageBuffer);
      const base64 = `data:${mimeType};base64,${imageBuffer.toString(
        "base64"
      )}`;

      log("Running UpscalerJS upscaling...", "debug");

      // Upscale the image
      const enhanced = await upscaler.upscale(base64);

      // Convert result back to buffer
      if (typeof enhanced === "string" && enhanced.startsWith("data:")) {
        const base64Data = enhanced.split(",")[1];
        const enhancedBuffer = Buffer.from(base64Data, "base64");

        log(
          `UpscalerJS: Original ${imageBuffer.length} bytes -> Enhanced ${enhancedBuffer.length} bytes`,
          "debug"
        );
        return enhancedBuffer;
      }

      throw new Error("Invalid output format from UpscalerJS");
    } catch (error) {
      throw new Error(`UpscalerJS error: ${error.message}`);
    }
  }

  /**
   * Enhance image using Pixteroid (Real-ESRGAN via NCNN)
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Promise<Buffer|null>} - Enhanced image buffer or null
   */
  async enhanceWithPixteroid(imageBuffer) {
    try {
      log("Attempting enhancement with Pixteroid", "debug");

      // Import Pixteroid
      const { upscale } = await import("pixteroid");

      // Create temporary file paths
      const timestamp = Date.now();
      const inputPath = path.join(this.tempDir, `input_${timestamp}.png`);
      const outputPath = path.join(this.tempDir, `output_${timestamp}.png`);

      try {
        // Write input buffer to temporary file
        fs.writeFileSync(inputPath, imageBuffer);

        log("Running Pixteroid upscaling...", "debug");

        // Upscale using Pixteroid with level2 enhancement
        await upscale(inputPath, outputPath, "level2");

        // Check if output file was created
        if (!fs.existsSync(outputPath)) {
          throw new Error("Output file not created");
        }

        // Read enhanced image
        const enhancedBuffer = fs.readFileSync(outputPath);

        log(
          `Pixteroid: Original ${imageBuffer.length} bytes -> Enhanced ${enhancedBuffer.length} bytes`,
          "debug"
        );

        return enhancedBuffer;
      } finally {
        // Clean up temporary files
        this.cleanupTempFiles([inputPath, outputPath]);
      }
    } catch (error) {
      throw new Error(`Pixteroid error: ${error.message}`);
    }
  }

  /**
   * Detect image MIME type from buffer
   * @param {Buffer} buffer - Image buffer
   * @returns {string} - MIME type
   */
  detectImageType(buffer) {
    // Check PNG signature
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }

    // Check JPEG signature
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      return "image/jpeg";
    }

    // Check GIF signature
    if (
      (buffer.length >= 6 && buffer.toString("ascii", 0, 6) === "GIF87a") ||
      buffer.toString("ascii", 0, 6) === "GIF89a"
    ) {
      return "image/gif";
    }

    // Check WebP signature
    if (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }

    // Default to PNG
    return "image/png";
  }

  /**
   * Clean up temporary files
   * @param {string[]} filePaths - Array of file paths to delete
   */
  cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          log(`Cleaned up temp file: ${path.basename(filePath)}`, "debug");
        }
      } catch (error) {
        log(
          `Failed to cleanup temp file ${filePath}: ${error.message}`,
          "warn"
        );
      }
    }
  }

  /**
   * Check if enhancement libraries are available
   * @returns {Promise<Object>} - Availability status
   */
  async checkAvailability() {
    const status = {
      upscalerjs: false,
      pixteroid: false,
      anyAvailable: false,
    };

    try {
      await import("upscaler");
      await import("@upscalerjs/esrgan-thick/4x");
      status.upscalerjs = true;
      log("UpscalerJS is available", "debug");
    } catch (error) {
      log("UpscalerJS is not available", "debug");
    }

    try {
      await import("pixteroid");
      status.pixteroid = true;
      log("Pixteroid is available", "debug");
    } catch (error) {
      log("Pixteroid is not available", "debug");
    }

    status.anyAvailable = status.upscalerjs || status.pixteroid;
    return status;
  }

  /**
   * Get enhancement info for display
   * @param {Buffer} originalBuffer - Original image buffer
   * @param {Buffer} enhancedBuffer - Enhanced image buffer
   * @returns {Object} - Enhancement information
   */
  getEnhancementInfo(originalBuffer, enhancedBuffer) {
    const originalSize = Math.round(originalBuffer.length / 1024);
    const enhancedSize = Math.round(enhancedBuffer.length / 1024);
    const wasEnhanced = enhancedBuffer.length !== originalBuffer.length;
    const sizeIncrease = enhancedSize - originalSize;
    const percentIncrease =
      originalSize > 0 ? Math.round((sizeIncrease / originalSize) * 100) : 0;

    return {
      wasEnhanced,
      originalSize,
      enhancedSize,
      sizeIncrease,
      percentIncrease,
    };
  }
}

export default new EmojiEnhancer();
