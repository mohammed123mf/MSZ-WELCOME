// Load .env for local development (Railway uses env vars natively)
try { require("dotenv").config(); } catch {}

const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

const TOKEN    = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌  Missing DISCORD_TOKEN or CLIENT_ID');
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
//  Background: 857 × 541
//  Circle center: (237, 278)  radius: 97
//  Arrow banner: x=368 y=248  w=452 h=62
// ─────────────────────────────────────────────
async function generateWelcomeImage(member) {
  const BG_PATH = path.join(__dirname, 'background.png');

  const bg = await loadImage(BG_PATH);
  const W  = bg.width;   // 857
  const H  = bg.height;  // 541

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // 1. Draw original background as-is
  ctx.drawImage(bg, 0, 0, W, H);

  // ── CIRCLE: paste avatar inside the ring ──────────────────
  const CX = 237, CY = 278, CR = 97;

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, CR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar    = await loadImage(avatarURL);
    ctx.drawImage(avatar, CX - CR, CY - CR, CR * 2, CR * 2);
  } catch {
    // Fallback: colored circle with initial
    ctx.fillStyle = '#3b1a22';
    ctx.fillRect(CX - CR, CY - CR, CR * 2, CR * 2);
    ctx.fillStyle = '#d4836a';
    ctx.font = `bold ${CR}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.user.username[0].toUpperCase(), CX, CY);
  }
  ctx.restore();

  // ── ARROW BANNER: write username inside the rectangle ─────
  // Arrow shape: starts at x=368 y=248, ends at ~x=820 y=310 (mid=279)
  const RECT_X   = 375;
  const RECT_MID = 279;  // vertical center of the arrow
  const RECT_W   = 400;  // usable text width inside the arrow (leave room for tip)

  const username = member.user.username;

  // Auto-fit font size based on name length
  let fontSize = 38;
  if (username.length > 16) fontSize = 28;
  else if (username.length > 12) fontSize = 32;

  // Shadow
  ctx.save();
  ctx.font         = `bold ${fontSize}px sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(0,0,0,0.55)';
  ctx.fillText(username, RECT_X + 2, RECT_MID + 2);

  // Main white text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(username, RECT_X, RECT_MID);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

// ─────────────────────────────────────────────
//  WELCOME EVENT
// ─────────────────────────────────────────────
const welcomeChannels = new Map();

client.on('guildMemberAdd', async (member) => {
  const channelId = welcomeChannels.get(member.guild.id) || member.guild.systemChannelId;
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  try {
    const buf        = await generateWelcomeImage(member);
    const attachment = new AttachmentBuilder(buf, { name: 'welcome.png' });
    const embed      = new EmbedBuilder()
      .setColor(0x7a2e3c)
      .setImage('attachment://welcome.png')
      .setDescription(`مرحباً <@${member.id}> في **MSZ** 🎉`)
      .setFooter({ text: `عدد الأعضاء: ${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed], files: [attachment] });
  } catch (err) {
    console.error('Welcome error:', err);
  }
});

// ─────────────────────────────────────────────
//  SLASH COMMANDS
// ─────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('حدد قناة الترحيب')
    .addChannelOption(o =>
      o.setName('channel').setDescription('قناة الترحيب').setRequired(true)
       .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('اختبر صورة الترحيب على نفسك')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('welcome-status')
    .setDescription('اعرض قناة الترحيب الحالية'),
].map(c => c.toJSON());

client.once('ready', async () => {
  console.log(`✅ Online as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered');
  } catch (e) {
    console.error('Commands error:', e);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setup-welcome') {
    const ch = interaction.options.getChannel('channel');
    welcomeChannels.set(interaction.guild.id, ch.id);
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x7a2e3c)
        .setTitle('✅ تم الإعداد')
        .setDescription(`قناة الترحيب: <#${ch.id}>`)],
      ephemeral: true,
    });
  }

  else if (interaction.commandName === 'test-welcome') {
    await interaction.deferReply({ ephemeral: true });
    try {
      const buf        = await generateWelcomeImage(interaction.member);
      const attachment = new AttachmentBuilder(buf, { name: 'welcome.png' });
      const embed      = new EmbedBuilder()
        .setColor(0x7a2e3c)
        .setImage('attachment://welcome.png')
        .setDescription(`مرحباً <@${interaction.user.id}> في **MSZ** 🎉`)
        .setFooter({ text: `عدد الأعضاء: ${interaction.guild.memberCount}` })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (e) {
      console.error(e);
      await interaction.editReply('❌ خطأ أثناء إنشاء الصورة');
    }
  }

  else if (interaction.commandName === 'welcome-status') {
    const id = welcomeChannels.get(interaction.guild.id);
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x7a2e3c)
        .setDescription(id ? `قناة الترحيب: <#${id}>` : '⚠️ لم يتم تحديد قناة. استخدم /setup-welcome')],
      ephemeral: true,
    });
  }
});

client.login(TOKEN);
