import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  AttachmentBuilder,
} from "discord.js";
import { createCanvas, Image } from "canvas";

// polyfills for qr-code-styling-node
global.self = global;
global.window = {};
global.document = {
  createElement: (tag: string) => {
    if (tag === "canvas") return createCanvas(500, 500);
    return {};
  },
};
global.Image = Image;

import { fileURLToPath } from "url";
import { dirname, join } from "path";
const { default: QRCodeStyling } = await import("qr-code-styling-node");

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Your logo file path
const logoPath = join(__dirname, "../img/TG Color Logo.png");

export default {
  data: new SlashCommandBuilder()
    .setName("qrcode")
    .setDescription("Generate a styled QR code")
    .addStringOption((opt) =>
      opt
        .setName("url")
        .setDescription("URL/text to encode in the QR code")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("bgcolor")
        .setDescription("Background color (default #ffffff)")
        .setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("size")
        .setDescription("QR code size in pixels (default 300)")
        .setRequired(false)
    ),

  async execute(data: { interaction: ChatInputCommandInteraction }) {
    const interaction = data.interaction;

    const url = interaction.options.getString("url", true);
    const bgColor = interaction.options.getString("bgcolor") || "#ffffff";
    const size = interaction.options.getInteger("size") || 300;

    // Acknowledge the command
    await interaction.deferReply();

    // Build the QR code
    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: "canvas",
      data: url,
      image: logoPath,
      margin: 10,

      qrOptions: {
        mode: "Byte",
        errorCorrectionLevel: "H",
      },

      imageOptions: {
        crossOrigin: "anonymous",
        imageSize: 0.4,
        margin: 0,
      },

      dotsOptions: {
        color: "#1e3a8a",
        type: "extra-rounded",
        gradient: {
          type: "radial",
          colorStops: [
            { offset: 0, color: "#8ba7c4" },
            { offset: 1, color: "#002951" },
          ],
        },
      },

      backgroundOptions: {
        color: bgColor,
      },

      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#f59e0b",
      },

      cornersDotOptions: {
        type: "dot",
        color: "#facc15",
      },
    });

    try {
      const buffer = await qrCode.getRawData("png");

      const attachment = new AttachmentBuilder(buffer, {
        name: `qrcode-${size}x${size}.png`,
      });

      // Replace the deferred reply with the image
      await interaction.editReply({
        content: `✨ Here is your QR code for: ${url}`,
        files: [attachment],
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Failed to generate QR code.");
    }
  },
};
