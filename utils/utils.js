const { WebhookClient, EmbedBuilder } = require("discord.js");
const config = require("../config");
const checkRarity = require("pokehint/functions/checkRarity");

function format(content) {
  let tokens = [];
  content.forEach((e) => {
    let x = e
      .split(";")
      .map((T) => {
        if (T) T.trim();
        return T;
      })
      .filter((x) => x);
    tokens.push(x[0]);
  });
  return tokens;
}

require("colors");

function log(message) {
  const timestamp = new Date().toISOString().slice(11, -5).cyan; // Extracting time in HH:mm:ss format and colorizing it
  const formattedMessage = `[${timestamp}] ${message}`;

  console.log(formattedMessage);
}
function getRate(initialDate, totalItems) {
  const currentDate = new Date();
  const timeElapsedInSeconds =
    (currentDate.getTime() - initialDate.getTime()) / 1000;
  const rate = totalItems / timeElapsedInSeconds;
  return rate.toFixed(2);
}
function formatPokemon(content) {
  let str = content; //`Congratulations <@1231528050127016009>! You caught a Level 4 Cacnea Sir<:female:1207734084210532483> (58.60%)!`;
  if (!content.startsWith("Congratulations")) return;
  let mainStr = str.split("!")[1].trim().split(" ");
  let main = str.split("!")[1].trim();
  //Name & level
  let levelIndex = main.split(" ").findIndex((x) => x == "Level") + 2;
  let nameStr = mainStr.slice(levelIndex).join(" ").trim();
  let iv = parseFloat(
    nameStr.substring(nameStr.indexOf(`(`) + 1, nameStr.length - 2)
  );
  nameStr = nameStr.substring(0, nameStr.indexOf(`(`));
  let level = parseInt(mainStr[4]),
    name = nameStr.substring(0, nameStr.indexOf("<"));
  let gender = nameStr.includes("female")
    ? `female`
    : nameStr.includes("male")
    ? `male`
    : `none`;
  return {
    name: name.trim(),
    level: level,
    gender: gender,
    iv: iv,
    shiny: str.includes("✨") || str.includes(":sparkles:"),
  };
}
checkRarity;
const colors = {
  Legendary: "Red",
  Mythical: "Red",
  "Ultra Beast": "Red",
  Regional: "Red",
  Event: "Green",
  Regular: "DarkButNotBlack",
  "Rare IV": "DarkButNotBlack",
  Shiny: "Gold",
};
function logHook(embeds) {
  if (embeds.length <= 0) return;
  let hook = new WebhookClient({
    url: config.logHook,
  });
  hook.send({
    username: `Hoopa Logger`,
    avatarURL: `https://cdn.discordapp.com/avatars/1231471729004646451/a_dd8d0d8528b1820f3e1d7e8298a4fd71.gif`,
    embeds: embeds,
  });
}
function chunk(array, size) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArray.push(array.slice(i, i + size));
  }
  return chunkedArray;
}

async function getGuilds(bot) {
  let def;
  let guildsWithMembers = [];
  let both = false;
  for (let guild of bot.guilds.cache.values()) {
    let p2, p2ass;
    try {
      p2ass = await guild.members.fetch("854233015475109888");
    } catch (error) {}
    try {
      p2 = await guild.members.fetch("716390085896962058");
    } catch (error) {}

    // Add properties to guild object
    guild.hasP2 = !!p2;
    guild.hasAssistant = !!p2ass;

    guildsWithMembers.push(guild);

    // Check if both members exist and a default guild is not set yet
    if (p2 && p2ass && !def && !both) {
      def = guild;
      both = true;
    }
    if ((p2 || p2ass) && !def && !both) def = guild;
  }
  if (!def) def = guildsWithMembers[0];

  // Return array with guilds and the default guild (if found)
  return [guildsWithMembers, def];
}
function commatize(number) {
  let numStr = number.toString();
  let formattedNumber = "";

  for (let i = numStr.length - 1, count = 0; i >= 0; i--) {
    formattedNumber = numStr[i] + formattedNumber;
    count++;
    if (count % 3 === 0 && i !== 0) {
      formattedNumber = "," + formattedNumber;
    }
  }
  return formattedNumber;
}

function hideUsername(username) {
  if (!username || username.length <= 4) return username;
  return username.slice(0, -4) + '****';
}

function createRareLogEmbed(caught, loggable, clientUser, messageUrl, image) {
  const rarityColors = {
    'Legendary': '#FF4500',
    'Mythical': '#FF4500',
    'Ultra Beast': '#FF4500',
    'Event': '#32CD32',
    'Regional': '#9370DB',
    'Shiny': '#FFD700',
    'Rare IV': '#1E90FF'
  };
  
  const rarityIcons = {
    'Legendary': '🔴',
    'Mythical': '🟣',
    'Ultra Beast': '🟠',
    'Event': '🟢',
    'Regional': '🔵',
    'Shiny': '⭐',
    'Rare IV': '🔷'
  };
  
  const primaryRarity = loggable[0] || 'Unknown';
  const color = rarityColors[primaryRarity] || '#808080';
  const icon = rarityIcons[primaryRarity] || '❓';
  
  const hiddenUsername = hideUsername(clientUser.username);
  
  const embed = new EmbedBuilder()
    .setURL(messageUrl)
    .setTitle(`${icon} ${caught.name} Caught!`)
    .setColor(color)
    .setThumbnail(image || 'https://cdn.discordapp.com/embed/avatars/0.png')
    .addFields(
      { 
        name: '👤 Caught By', 
        value: `**${hiddenUsername}**`, 
        inline: true 
      },
      { 
        name: '📊 Level', 
        value: `**${caught.level}**`, 
        inline: true 
      },
      { 
        name: '💎 IV Percentage', 
        value: `**${caught.iv.toFixed(2)}%**`, 
        inline: true 
      },
      { 
        name: '✨ Shiny Status', 
        value: caught.shiny ? '**✅ YES ✨**' : '**❌ No**', 
        inline: true 
      },
      { 
        name: '⚧️ Gender', 
        value: `**${caught.gender}**`, 
        inline: true 
      },
      { 
        name: '🏷️ Rarity', 
        value: `**${loggable.join(' | ') || 'Unknown'}**`, 
        inline: true 
      }
    )
    .setFooter({ 
      text: `Zeta AutoCatcher • ${new Date().toLocaleTimeString()}`, 
      iconURL: 'https://cdn.discordapp.com/emojis/852406980529381406.png' 
    })
    .setTimestamp();
    
  return embed;
}

function createHelpEmbed(prefix, botUser) {
  const embed = new EmbedBuilder()
    .setTitle('🤖 Zeta AutoCatcher v1.3')
    .setColor('#7289DA')
    .setThumbnail('https://cdn.discordapp.com/attachments/1457742565704208446/1466448180794364024/logo.png?ex=697cc7cb&is=697b764b&hm=ebfbb82bae94c5d9b78a975c4b60951916020262a9a1fc86ad4d40ff8418099d')
    .setDescription(
      '```ansi\n\x1b[1;36m🚀 Advanced Pokétwo Autocatcher with AI Integration\x1b[0m\n\n' +
      '\x1b[1;37mFeatures:\x1b[0m\n' +
      '• 🎯 Hint(Default) + AI-Powered Catching\n' +
      '• 🔐 Automatic Captcha Solving\n' +
      '• 📊 Real-time Statistics & Analytics\n' +
      '• 💰 Market Automation\n' +
      '• 🔄 Multi-Account Support\n' +
      '• 🛡️ Advanced Features\n\n' +
      '\x1b[1;33m💡 Pro Tip:\x1b[0m Use \x1b[1;32m🔄 Refresh\x1b[0m buttons for live updates!\n```'
    )
    .addFields(
      {
        name: '⚡ System Commands', 
        value: '\n' +
          `\`${prefix}ping\` • Check bot response time\n` +
          `\`${prefix}help\` • Display this command guide\n` +
          `\`${prefix}support\` • Get support information\n` +
          `\`${prefix}reload\` • Restart all autocatcher instances\n` +
          `\`${prefix}set-prefix <prefix>\` • Change command prefix`,
        inline: true
      },
      {
        name: '👑 Administration', 
        value: '\n' +
          `\`${prefix}owner <id> add/remove\` • Manage bot administrators\n` +
          `\`${prefix}add-token <token>\` • Add new bot account\n` +
          `\`${prefix}current-tokens\` • View all connected accounts\n` +
          `\`${prefix}clear\` or \`${prefix}reset\` • Clear all tokens`,
        inline: true
      },
      {
        name: '🎣 Catching Controls', 
        value: '\n' +
          `\`${prefix}catcher <id> start/stop\` • Toggle catching for specific bot\n` +
          `\`${prefix}catcher start/stop\` • Toggle catching globally\n` +
          `\`${prefix}ai-catch <id> start/stop\` • Toggle AI catching for specific bot\n` +
          `\`${prefix}ai-catch start/stop\` • Toggle AI catching globally\n` +
          `\`${prefix}captcha <id> start/stop\` • Toggle captcha solver for specific bot\n` +
          `\`${prefix}captcha start/stop\` • Toggle captcha solver globally`,
        inline: true
      },
      {
        name: '📊 Data & Analytics', 
        value: '\n' +
          `\`${prefix}stats\` • View detailed catching statistics\n` +
          `\`${prefix}pokemon\` • Browse caught Pokemon by categories\n` +
          `\`${prefix}mpanel\` • Open interactive market panel`,
        inline: true
      },
      {
        name: '🔐 Captcha & AI', 
        value: '\n' +
          `\`${prefix}solver <token> <userid>\` • Test/solve captcha manually\n` +
          `\`${prefix}balance\` • Check API key balance\n` +
          `\`${prefix}ai-test\` • Test AI catching accuracy`,
        inline: true
      },
      {
        name: '💰 Premium Services', 
        value: '\n' +
          '**Captcha Solves:** [graceshop.mysellauth.com](https://graceshop.mysellauth.com)\n' +
          '**AI Catching:** DM momento.de (99.7%+ accuracy)\n' +
          '**Support:** [discord.gg/BgGmu4RgUJ](https://discord.gg/BgGmu4RgUJ)',
        inline: true
      }
    )
    .setFooter({ 
      text: 'Zeta AutoCatcher v1.3 • Open Source & Premium Features', 
      iconURL: 'https://cdn.discordapp.com/emojis/852406980529381406.png'
    })
    .setTimestamp();
    
  return embed;
}

module.exports = {
  format,
  log,
  formatPokemon,
  logHook,
  colors,
  chunk,
  getGuilds,
  commatize,
  getRate,
  hideUsername,
  createRareLogEmbed,
  createHelpEmbed
};
