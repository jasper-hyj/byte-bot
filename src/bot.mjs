import { createCanvas, Image } from "canvas";

global.self = global;
global.window = {};
global.document = {
  createElement: (tag) => {
    if (tag === "canvas") return createCanvas(500, 500); // adjust as needed
    return {};
  },
};
global.Image = Image;


import { Client, GatewayIntentBits, REST, Routes, AttachmentBuilder } from "discord.js";
const { default: QRCodeStyling } = await import("qr-code-styling-node");
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import 'dotenv/config';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Absolute path to your logo
const logoPath = join(__dirname, "../img/TG Color Logo.png");

// Slash command definition
const commands = [
  {
    name: "qrcode",
    description: "Generate a styled QR code",
    options: [
      {
        name: "url",
        description: "The URL/text for the QR code",
        type: 3, // STRING
        required: true,
      },
      {
        name: "bgcolor",
        description: "Background color (default: #ffffff)",
        type: 3,
        required: false,
      },
      {
        name: "size",
        description: "Size in pixels (default: 300)",
        type: 4, // INTEGER
        required: false,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands registered ✅");
  } catch (err) {
    console.error(err);
  }
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "qrcode") {
    const url = interaction.options.getString("url");
    const bgColor = interaction.options.getString("bgcolor") || "#ffffff";
    const size = interaction.options.getInteger("size") || 300;

    // Build styled QR
    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: "canvas",
      data: url,
      image: logoPath, // ✅ use file path, not import
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
      // Generate buffer
      const buffer = await qrCode.getRawData("png");

      // Send back as attachment
      const attachment = new AttachmentBuilder(buffer, {
        name: `qrcode-${size}x${size}.png`,
      });

      await interaction.reply({
        content: `✨ Here’s your styled QR for: ${url}`,
        files: [attachment],
      });
    } catch (err) {
      console.error(err);
      await interaction.reply("❌ Failed to generate QR code.");
    }
  }
});

registerCommands();
client.login(TOKEN);