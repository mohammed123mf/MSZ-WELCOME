// Load .env for local development (Railway uses env vars natively)
try { require("dotenv").config(); } catch {}

const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const TOKEN   = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌  Missing DISCORD_TOKEN or CLIENT_ID in environment variables!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─────────────────────────────────────────────
//  GENERATE WELCOME IMAGE
// ─────────────────────────────────────────────
async function generateWelcomeImage(member) {
  const W = 900, H = 500;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // 1. Background
  try {
    const bg = await loadImage(path.join(__dirname, 'background.png'));
    ctx.drawImage(bg, 0, 0, W, H);
  } catch {
    ctx.fillStyle = '#2d1a1f';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Semi-transparent dark overlay so text pops
  ctx.fillStyle = 'rgba(15, 5, 8, 0.45)';
  ctx.fillRect(0, 0, W, H);

  // ── CIRCLE (profile picture) ──────────────────
  const CIRCLE_X = 240, CIRCLE_Y = 230, CIRCLE_R = 90;

  // Glowing ring (rose-gold)
  ctx.save();
  ctx.beginPath();
  ctx.arc(CIRCLE_X, CIRCLE_Y, CIRCLE_R + 10, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4836a';
  ctx.lineWidth   = 3;
  ctx.shadowColor = '#d4836a';
  ctx.shadowBlur  = 18;
  ctx.stroke();
  ctx.restore();

  // Clip avatar into circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(CIRCLE_X, CIRCLE_Y, CIRCLE_R, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar    = await loadImage(avatarURL);
    ctx.drawImage(avatar, CIRCLE_X - CIRCLE_R, CIRCLE_Y - CIRCLE_R, CIRCLE_R * 2, CIRCLE_R * 2);
  } catch {
    ctx.fillStyle = '#4a1a22';
    ctx.fillRect(CIRCLE_X - CIRCLE_R, CIRCLE_Y - CIRCLE_R, CIRCLE_R * 2, CIRCLE_R * 2);
    ctx.fillStyle = '#d4836a';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.user.username[0].toUpperCase(), CIRCLE_X, CIRCLE_Y);
  }
  ctx.restore();

  // ── ARROW BANNER (name plate) ────────────────
  // Arrow pointing right — same shape as in the original image
  const ARROW = { x: 370, y: 195, w: 440, h: 70, tip: 40 };

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ARROW.x, ARROW.y);
  ctx.lineTo(ARROW.x + ARROW.w - ARROW.tip, ARROW.y);
  ctx.lineTo(ARROW.x + ARROW.w, ARROW.y + ARROW.h / 2);
  ctx.lineTo(ARROW.x + ARROW.w - ARROW.tip, ARROW.y + ARROW.h);
  ctx.lineTo(ARROW.x, ARROW.y + ARROW.h);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(60, 20, 28, 0.70)';
  ctx.strokeStyle = '#c47a62';
  ctx.lineWidth   = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // "WELCOME TO MSZ" bracket label inside the banner area
  ctx.save();
  ctx.font         = 'bold 16px sans-serif';
  ctx.fillStyle    = '#c4886e';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  // Bracket decorations like the original
  ctx.fillText('⌐  MSZ  ¬', ARROW.x + 18, ARROW.y + 10);
  ctx.restore();

  // Username inside the arrow
  const username = member.user.username;
  ctx.save();
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  const MID_Y = ARROW.y + ARROW.h / 2 + 8;

  // Shadow pass
  ctx.font       = 'bold 34px sans-serif';
  ctx.fillStyle  = 'rgba(0,0,0,0.6)';
  ctx.fillText(username, ARROW.x + 22, MID_Y + 2);
  // Main text
  ctx.fillStyle  = '#ffffff';
  ctx.fillText(username, ARROW.x + 20, MID_Y);
  ctx.restore();

  // "WELCOME TO" small text above the arrow
  ctx.save();
  ctx.font         = '500 15px sans-serif';
  ctx.fillStyle    = 'rgba(220,180,160,0.9)';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('WELCOME TO', ARROW.x + 20, ARROW.y - 8);
  ctx.restore();

  // Member count below the arrow
  ctx.save();
  ctx.font         = '13px sans-serif';
  ctx.fillStyle    = 'rgba(200,160,140,0.8)';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Member #${member.guild.memberCount}`, ARROW.x + 20, ARROW.y + ARROW.h + 12);
  ctx.restore();

  // Sparkle decorations (top-right corner, matching original)
  const sparkleDraw = (x, y, size, alpha) => {
    ctx.save();
    ctx.strokeStyle = `rgba(212,131,106,${alpha})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
    ctx.moveTo(x - size * 0.6, y - size * 0.6); ctx.lineTo(x + size * 0.6, y + size * 0.6);
    ctx.moveTo(x + size * 0.6, y - size * 0.6); ctx.lineTo(x - size * 0.6, y + size * 0.6);
    ctx.stroke();
    ctx.restore();
  };
  sparkleDraw(790, 290, 14, 0.9);
  sparkleDraw(830, 310, 8,  0.6);
  sparkleDraw(810, 340, 5,  0.4);

  return canvas.toBuffer('image/png');
}

// ─────────────────────────────────────────────
//  WELCOME EVENT
// ─────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  // Find the welcome channel stored per-guild (or fall back to system channel)
  const channelId = welcomeChannels.get(member.guild.id) || member.guild.systemChannelId;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  try {
    const imageBuffer = await generateWelcomeImage(member);
    const attachment  = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

    const embed = new EmbedBuilder()
      .setColor(0x8b3a4a)
      .setDescription(`> مرحباً بك <@${member.id}> في **MSZ** 🎉\n> نتمنى لك وقتاً ممتعاً معنا!`)
      .setImage('attachment://welcome.png')
      .setFooter({ text: `Member #${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed], files: [attachment] });
  } catch (err) {
    console.error('Error sending welcome:', err);
  }
});

// ─────────────────────────────────────────────
//  PER-GUILD WELCOME CHANNEL STORAGE (in-memory, use DB for persistence)
// ─────────────────────────────────────────────
const welcomeChannels = new Map();

// ─────────────────────────────────────────────
//  SLASH COMMANDS
// ─────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('حدد قناة الترحيب للبوت')
    .addChannelOption(opt =>
      opt.setName('channel')
         .setDescription('القناة التي سيرسل فيها البوت رسائل الترحيب')
         .setRequired(true)
         .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('اختبر رسالة الترحيب على نفسك')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('welcome-status')
    .setDescription('اعرض إعدادات قناة الترحيب الحالية'),
].map(c => c.toJSON());

// Register slash commands when bot is ready
client.once('ready', async () => {
  console.log(`✅  Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('🔄  Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅  Slash commands registered globally.');
  } catch (err) {
    console.error('❌  Failed to register commands:', err);
  }
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setup-welcome') {
    const channel = interaction.options.getChannel('channel');
    welcomeChannels.set(interaction.guild.id, channel.id);

    const embed = new EmbedBuilder()
      .setColor(0x8b3a4a)
      .setTitle('✅ تم الإعداد')
      .setDescription(`تم تحديد <#${channel.id}> كقناة ترحيب.\nسيتلقى الأعضاء الجدد رسالة ترحيب عند انضمامهم.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  else if (interaction.commandName === 'test-welcome') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const imageBuffer = await generateWelcomeImage(interaction.member);
      const attachment  = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

      const embed = new EmbedBuilder()
        .setColor(0x8b3a4a)
        .setDescription(`> مرحباً بك <@${interaction.user.id}> في **MSZ** 🎉\n> نتمنى لك وقتاً ممتعاً معنا!`)
        .setImage('attachment://welcome.png')
        .setFooter({ text: `Member #${interaction.guild.memberCount}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ حدث خطأ أثناء إنشاء صورة الترحيب.');
    }
  }

  else if (interaction.commandName === 'welcome-status') {
    const channelId = welcomeChannels.get(interaction.guild.id);
    const embed = new EmbedBuilder()
      .setColor(0x8b3a4a)
      .setTitle('ℹ️ إعدادات الترحيب')
      .setDescription(channelId
        ? `قناة الترحيب الحالية: <#${channelId}>`
        : '⚠️ لم يتم تحديد قناة ترحيب بعد.\nاستخدم `/setup-welcome` لتحديدها.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
client.login(TOKEN);
