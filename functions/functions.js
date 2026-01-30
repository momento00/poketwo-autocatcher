const fs = require("fs");
const path = require("path");
const { AutoCatcher } = require("../functions/catcher");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { commatize, chunk } = require("../utils/utils");


let autocatchers = [];
let tokens = [];

async function stop() {
  for (const ac of autocatchers) {
    await ac.client.destroy();
  }
  autocatchers.length = 0;
  tokens.length = 0;
}

// Token management functions
function loadTokensFromFile() {
  const tokensPath = path.join(__dirname, "..", "data", "tokens.json");
  
  if (!fs.existsSync(tokensPath)) {
    console.log("Tokens file does not exist, creating empty tokens.json.".yellow);
    fs.writeFileSync(tokensPath, JSON.stringify([], null, 2));
    return [];
  }

  try {
    const data = fs.readFileSync(tokensPath, "utf-8");
    const tokenz = JSON.parse(data);
    const validTokens = Array.isArray(tokenz) ? tokenz.filter(token => token && token.trim().length > 0) : [];
    
    if (validTokens.length === 0) {
      console.log("No valid tokens found in tokens.json".yellow);
    }
    
    return validTokens;
  } catch (error) {
    console.log("Error reading tokens.json, creating backup and new file.".red);
    // Backup the corrupted file
    const backupPath = path.join(__dirname, "..", "data", `tokens_backup_${Date.now()}.json`);
    fs.copyFileSync(tokensPath, backupPath);
    
    // Create new empty file
    fs.writeFileSync(tokensPath, JSON.stringify([], null, 2));
    return [];
  }
}

function saveTokensToFile(tokens) {
  const tokensPath = path.join(__dirname, "..", "data", "tokens.json");
  try {
    const uniqueTokens = [...new Set(tokens.filter(token => token && token.trim().length > 0))];
    fs.writeFileSync(tokensPath, JSON.stringify(uniqueTokens, null, 2));
    console.log(`Saved ${uniqueTokens.length} tokens to tokens.json`.green);
    return true;
  } catch (error) {
    console.log("Error saving tokens to file:".red, error.message);
    return false;
  }
}

async function start() {
  const tokenz = loadTokensFromFile();

  if (tokenz.length === 0) {
    console.log("No tokens found in tokens.json.".yellow);
    return null;
  }

  console.log(`Loading ${tokenz.length} tokens...`.cyan);

  const logs = await Promise.all(
    tokenz.map(async (token) => {
      const ac = new AutoCatcher(token);

      try {
        await ac.login();
        await ac.catcher();
        await new Promise((resolve, reject) => {
          ac.start((res) => {
            if (res.includes("Logged in")) {
              autocatchers.push(ac);
              tokens.push(token);
              resolve(res);
            } else {
              reject(res);
            }
          });
        });
        return `Logged in successfully with token ending in ${token.slice(-5)}`;
      } catch (error) {
        return `Failed to login with token ending in ${token.slice(-5)}`;
      }
    })
  );

  return logs;
}

async function addToken(token, callback) {
  // Clean and normalize the token
  const cleanToken = token.trim();
  
  // Check if token already exists in autocatchers by comparing actual tokens
  const existingAutocatcher = autocatchers.find((ac) => {
    return ac.token === cleanToken;
  });
  
  if (existingAutocatcher) {
    callback(`- Autocatcher already exists!`, false);
    return;
  }

  // Check if token already exists in the file
  const savedTokens = loadTokensFromFile();
  if (savedTokens.some(savedToken => savedToken === cleanToken)) {
    callback(`- Token already exists in tokens.json!`, false);
    return;
  }

  const ac = new AutoCatcher(cleanToken);
  try {
    await ac.login();
    let loggedIn = false;
    let callbackCalled = false;

    // Set up the ready event listener
    ac.client.once('ready', async () => {
      if (callbackCalled) return;
      
      loggedIn = true;
      callbackCalled = true;
      
      // Start the catcher functionality
      ac.catcher();
      
      // Add to autocatchers and tokens arrays
      autocatchers.push(ac);
      tokens.push(cleanToken);
      
      // Save token to file
      const currentTokens = loadTokensFromFile();
      currentTokens.push(cleanToken);
      const saved = saveTokensToFile(currentTokens);
      
      const successMessage = `Logged in as ${ac.client.user.tag}`;
      
      if (saved) {
        console.log(`Token saved to tokens.json successfully`.green);
        callback(successMessage + `\n- Token saved to file successfully!`, true);
      } else {
        console.log(`Failed to save token to tokens.json`.red);
        callback(successMessage + `\n- Warning: Token added but failed to save to file!`, true);
      }
    });

    // Handle login errors
    ac.client.on('error', (error) => {
      if (!callbackCalled) {
        callbackCalled = true;
        callback(`- Login failed: ${error.message}`, false);
      }
    });
    
    // Timeout for login
    setTimeout(() => {
      if (!loggedIn && !callbackCalled) {
        callbackCalled = true;
        callback(
          `- Failed to login into ${
            cleanToken.substring(0, cleanToken.indexOf(".")) || `_token_`
          } | Invalid Token or Timeout`,
          false
        );
      }
    }, 10000); // Increased timeout to 10 seconds
    
  } catch (error) {
    if (!callbackCalled) {
      callback(`- Error occurred: ${error.message}`, false);
    }
  }
}

async function statMsg(message, page = 0) {
  const bot = message.client;

  if (autocatchers.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle("Zeta Catcher Stats")
      .setDescription("*No catcher connected yet.*")
      .setColor("DarkButNotBlack")
      .setFooter({
        text: "Pokemon Catcher System",
        iconURL: bot.user.displayAvatarURL(),
      });

    const row2 = new ActionRowBuilder().setComponents(
      new ButtonBuilder()
        .setCustomId("add_token_modal")
        .setLabel("➕ Add Token")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("remove_token_modal")
        .setLabel("➖ Remove Token")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("refresh_stats")
        .setLabel("🔄 Refresh")
        .setStyle(ButtonStyle.Secondary)
    );

    if (message.author) {
      await message.channel.send({ embeds: [embed], components: [row2] });
    } else {
      await message.update({ embeds: [embed], components: [row2] });
    }
    return;
  }

  let bal = 0,
    catches = 0;
  const fields = autocatchers
    .filter((x) => x.client.ws.status === 0)
    .map((x, i) => {
      const userName =
        x.client.user.globalName || x.client.user.displayName || "Unknown User";
      const userPing = `<t:${Math.floor(x.stats.lastCatch / 1000)}:R>${
        x.captcha
          ? `\n• ❕ [Captcha](https://verify.poketwo.net/captcha/${x.client.user.id})`
          : ``
      }`;

      bal += x.stats.coins + x.stats.tcoins;
      catches += x.stats.catches;

      return `**${i + 1}. ${userName}** • \`${commatize(
        x.stats.catches
      )}\` • \`${commatize(x.stats.coins + x.stats.tcoins)}\` • ${userPing}`;
    });

  const itemsPerPage = 10;
  const chunks = chunk(fields, itemsPerPage);
  const totalPages = chunks.length;

  const activeConnections = autocatchers.filter((x) => x.client.ws.status === 0).length;
  const embed = new EmbedBuilder()
    .setTitle("**Zeta AC Statistics**")
    .setColor("#00BFFF")
    .setDescription(
      `**__System Overview__**\n` +
      `🤖 **Total Accounts:** ${commatize(autocatchers.length)}\n` +
      `🟢 **Active Connections:** ${commatize(activeConnections)}\n` +
      `🎣 **Total Catches:** ${commatize(catches)}\n` +
      `💰 **Total PokéCoins:** ${commatize(bal)}\n\n` +
      `**__Account Details__** ${page + 1}/${Math.max(totalPages, 1)}\n` +
      `${totalPages > 0 ? chunks[page].join("\n") : "*No active accounts*"}\n\n` +
      `> *Last updated:* <t:${Math.floor(Date.now() / 1000)}:R>`
    )
    .setFooter({
      text: "Zeta AutoCatcher • Page Navigation",
      iconURL: bot.user.displayAvatarURL(),
    })
    .setThumbnail(bot.user.displayAvatarURL())
    .setTimestamp();

  const row1 = new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setCustomId(
        `statPage-L-${page}-${
          message.author ? message.author.id : message.user.id
        }`
      )
      .setLabel("◀ Previous")
      .setDisabled(page === 0)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("refresh_stats")
      .setLabel("🔄")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(
        `statPage-R-${page}-${
          message.author ? message.author.id : message.user.id
        }`
      )
      .setLabel("Next ▶")
      .setDisabled(page >= totalPages - 1)
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setCustomId("add_token_modal")
      .setLabel("➕ Add Token")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("remove_token_modal")
      .setLabel("➖ Remove Token")
      .setStyle(ButtonStyle.Danger)
  );

  if (message.author) {
    await message.channel.send({ embeds: [embed], components: [row1, row2] });
  } else {
    await message.update({ embeds: [embed], components: [row1, row2] });
  }
}

// Error handling system
let restartBarrier = false;
let crashCounter = 0;

// Activate error handling
setTimeout(() => {
  restartBarrier = true;
  console.log("🛡️ Error handling system activated".green);
}, 5000);

process.on("unhandledRejection", (error) => {
  if (restartBarrier) {
    console.log("❌ Unhandled Promise Rejection handled:", error.message);
    return;
  }

  crashCounter++;
  console.log(`Unhandled Promise Rejection caught (${crashCounter}):`, error.message);

  const embed = new EmbedBuilder()
    .setTitle(`Unhandled Promise Rejection`)
    .setDescription(
      `\`\`\`js\n${error.message}\n\`\`\`\nNoticed at: <t:${Math.floor(
        Date.now() / 1000
      )}:R>`
    )
    .setColor(`Orange`);

  console.log("Unhandled Promise Rejection:", error.message);
});

process.on("uncaughtException", (error) => {
  if (restartBarrier) {
    console.log("❌ Uncaught Exception handled:", error.message);
    return;
  }

  crashCounter++;
  console.log(`Uncaught Exception caught (${crashCounter}):`, error.message);

  const embed = new EmbedBuilder()
    .setTitle(`Uncaught Exception`)
    .setDescription(
      `\`\`\`js\n${error.message}\n\`\`\`\nNoticed at: <t:${Math.floor(
        Date.now() / 1000
      )}:R>`
    )
    .setColor(`Orange`);

  console.log("Uncaught Exception:", error.message);
});

async function removeToken(token, callback) {
  try {
    // Find autocatcher with the token
    const autocatcherIndex = autocatchers.findIndex((ac) => ac.token === token);
    
    if (autocatcherIndex === -1) {
      callback("❌ Token not found in active autocatchers!", false);
      return;
    }

    // Destroy the client connection
    await autocatchers[autocatcherIndex].client.destroy();

    // Remove from autocatchers array
    autocatchers.splice(autocatcherIndex, 1);

    // Remove from tokens array
    const tokenIndex = tokens.findIndex(t => t === token);
    if (tokenIndex !== -1) {
      tokens.splice(tokenIndex, 1);
    }

    // Remove from file
    const currentTokens = loadTokensFromFile();
    const updatedTokens = currentTokens.filter(t => t !== token);
    const saved = saveTokensToFile(updatedTokens);
    
    if (saved) {
      callback("✅ Token successfully removed from autocatcher and saved!", true);
      console.log(`Token removed from tokens.json successfully`.green);
    } else {
      callback("⚠️ Token removed from autocatcher but failed to save to file!", false);
      console.log(`Failed to save updated tokens to tokens.json`.red);
    }
    
  } catch (error) {
    callback(`❌ Error removing token: ${error.message}`, false);
  }
}

module.exports = {
  stop,
  start,
  addToken,
  removeToken,
  statMsg,
  autocatchers,
  tokens,
  loadTokensFromFile,
  saveTokensToFile,
};
