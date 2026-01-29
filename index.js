const fs = require("fs");
const path = require("path");
require("colors");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageEmbed,
} = require("discord.js");
const wait = require("node:timers/promises").setTimeout;
const { AutoCatcher } = require("./functions/catcher");
const { 
  showMarketPanel, 
  handleAccountSelection, 
  handleServerSelection, 
  handleMarketPurchase 
} = require("./functions/market");
const config = require("./config");
const { log } = require("./utils/utils");
const { statMsg, autocatchers, start, stop, addToken, addTokensBulk, removeToken } = require("./functions/functions");
const { solveCaptcha, sendCaptchaMessage } = require("./utils/api");
const { checkApiKeyBalance } = require("./utils/api");
const { compileFunction } = require("vm");
const { chunk, createHelpEmbed } = require("./utils/utils");

const poketwo = "716390085896962058";
let owners = config.owners;
let prefix = config.prefix;
let mainIDInstance = null;
let tokens = [];
const PAGE_SIZE = 5;
const p2Filter = (p2Msg) => p2Msg.author.id === poketwo;

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

bot.on("ready", async () => {
log(`Connected as ${bot.user.tag}`.cyan);
try {
await stop(); // same stop used in your reload command
const logs = await start(); // same start used in your reload command
log('Auto-reloaded all tokens');
} catch (e) {
console.error("Auto-reload failed:", e);
}
});

bot.on("interactionCreate", async (interaction) => {
  if (!owners.includes(interaction.user.id)) {
    if (interaction.isButton() || interaction.isModalSubmit()) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "You are not authorised to use this!", flags: [4096] });
      }
      return;
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith("market_account_select")) {
      await handleAccountSelection(interaction, autocatchers);
    } else if (interaction.customId.startsWith("market_server_select")) {
      await handleServerSelection(interaction);
    }
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith("previous") || interaction.customId.startsWith("next")) {
      await handleTokenPageNavigation(interaction);
    } else if (interaction.customId.startsWith("statPage")) {
      await handlePageNavigation(interaction);
    } else if (interaction.customId === "add_token_modal") {
      await showAddTokenModal(interaction);
    } else if (interaction.customId === "remove_token_modal") {
      await showRemoveTokenModal(interaction);
    } else if (interaction.customId.startsWith("pdata_nav_")) {
      // Handle pokemon pagination navigation
      const parts = interaction.customId.split("_");
      const category = parts[2];
      const currentPage = parseInt(parts[3]);
      const direction = parts[4];

      let newPage = currentPage;
      if (direction === "next") newPage++;
      if (direction === "prev") newPage--;

      // Recreate the pokemon list for this category
      let allPokemon = [];
      let categoryName = "";
      let emoji = "";

      for (const ac of autocatchers) {
        let categoryPokemon = [];
        switch (category) {
          case "legendary":
            categoryPokemon = ac.pokemonData.legendary;
            categoryName = "Legendary Pokémon";
            emoji = "🔴";
            break;
          case "shiny":
            categoryPokemon = ac.pokemonData.shiny;
            categoryName = "Shiny Pokémon";
            emoji = "✨";
            break;
          case "mythical":
            categoryPokemon = ac.pokemonData.mythical;
            categoryName = "Mythical Pokémon";
            emoji = "🟣";
            break;
          case "ultrabeast":
            categoryPokemon = ac.pokemonData.ultraBeast;
            categoryName = "Ultra Beast Pokémon";
            emoji = "🟠";
            break;
          case "rareiv":
            categoryPokemon = ac.pokemonData.rareIV;
            categoryName = "Rare IV Pokémon";
            emoji = "📊";
            break;
          case "event":
            categoryPokemon = ac.pokemonData.event;
            categoryName = "Event Pokémon";
            emoji = "🎉";
            break;
          case "regional":
            categoryPokemon = ac.pokemonData.regional;
            categoryName = "Regional Pokémon";
            emoji = "🌍";
            break;
          case "all":
            categoryPokemon = ac.pokemonData.all;
            categoryName = "All Pokémon";
            emoji = "📋";
            break;
        }

        categoryPokemon.forEach(pokemon => {
          allPokemon.push({
            ...pokemon,
            user: ac.client.user.username
          });
        });
      }

      allPokemon.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const itemsPerPage = 10;
      const pages = chunk(allPokemon, itemsPerPage);

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${categoryName}`)
        .setColor("#3498db")
        .setDescription(
          pages[newPage].map((pokemon, index) => {
            const ivColor = pokemon.iv > 90 ? "🟢" : pokemon.iv < 10 ? "🔴" : "🟡";
            const shinyIcon = pokemon.shiny ? "✨" : "";
            return `**${newPage * itemsPerPage + index + 1}.** ${shinyIcon}${pokemon.name} ${ivColor}\n` +
                   `   • **IV:** ${pokemon.iv.toFixed(2)}% • **Lvl:** ${pokemon.level} • **User:** ${pokemon.user}`;
          }).join("\n")
        )
        .setFooter({
          text: `Page ${newPage + 1} of ${pages.length} | Total: ${allPokemon.length} Pokémon`
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`pdata_nav_${category}_${newPage}_prev`)
          .setLabel("◀ Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(newPage === 0),
        new ButtonBuilder()
          .setCustomId(`pdata_nav_${category}_${newPage}_next`)
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(newPage >= pages.length - 1),
        new ButtonBuilder()
          .setCustomId("pdata_back")
          .setLabel("🔙 Back to Categories")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.update({ embeds: [embed], components: [row] });
    } else if (interaction.customId.startsWith("pdata_")) {
    const category = interaction.customId.replace("pdata_", "");

    // Collect all pokemon from all autocatchers for the specified category
    let allPokemon = [];
    let categoryName = "";
    let emoji = "";

    for (const ac of autocatchers) {
      let categoryPokemon = [];
      switch (category) {
        case "legendary":
          categoryPokemon = ac.pokemonData.legendary;
          categoryName = "Legendary Pokémon";
          emoji = "🔴";
          break;
        case "shiny":
          categoryPokemon = ac.pokemonData.shiny;
          categoryName = "Shiny Pokémon";
          emoji = "✨";
          break;
        case "mythical":
          categoryPokemon = ac.pokemonData.mythical;
          categoryName = "Mythical Pokémon";
          emoji = "🟣";
          break;
        case "ultrabeast":
          categoryPokemon = ac.pokemonData.ultraBeast;
          categoryName = "Ultra Beast Pokémon";
          emoji = "🟠";
          break;
        case "rareiv":
          categoryPokemon = ac.pokemonData.rareIV;
          categoryName = "Rare IV Pokémon";
          emoji = "📊";
          break;
        case "event":
          categoryPokemon = ac.pokemonData.event;
          categoryName = "Event Pokémon";
          emoji = "🎉";
          break;
        case "regional":
          categoryPokemon = ac.pokemonData.regional;
          categoryName = "Regional Pokémon";
          emoji = "🌍";
          break;
        case "all":
          categoryPokemon = ac.pokemonData.all;
          categoryName = "All Pokémon";
          emoji = "📋";
          break;
      }

      // Add user info to each pokemon
      categoryPokemon.forEach(pokemon => {
        allPokemon.push({
          ...pokemon,
          user: ac.client.user.username
        });
      });
    }

    if (allPokemon.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${categoryName}`)
        .setDescription("No Pokémon found in this category yet.")
        .setColor("#95a5a6");

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [embed], flags: [4096] });
      }
      return;
    }

    // Sort by timestamp (newest first)
    allPokemon.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Create pages of 10 pokemon each
    const itemsPerPage = 10;
    const pages = chunk(allPokemon, itemsPerPage);
    const currentPage = 0;

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${categoryName}`)
      .setColor("#3498db")
      .setDescription(
        pages[currentPage].map((pokemon, index) => {
          const ivColor = pokemon.iv > 90 ? "🟢" : pokemon.iv < 10 ? "🔴" : "🟡";
          const shinyIcon = pokemon.shiny ? "✨" : "";
          return `**${currentPage * itemsPerPage + index + 1}.** ${shinyIcon}${pokemon.name} ${ivColor}\n` +
                 `   • **IV:** ${pokemon.iv.toFixed(2)}% • **Lvl:** ${pokemon.level} • **User:** ${pokemon.user}`;
        }).join("\n")
      )
      .setFooter({
        text: `Page ${currentPage + 1} of ${pages.length} | Total: ${allPokemon.length} Pokémon`
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pdata_nav_${category}_${currentPage}_prev`)
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId(`pdata_nav_${category}_${currentPage}_next`)
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= pages.length - 1),
      new ButtonBuilder()
        .setCustomId("pdata_back")
        .setLabel("🔙 Back to Categories")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  } else if (interaction.customId === "pdata_back") {
    const embed = new EmbedBuilder()
      .setTitle("🗃️ Pokémon Data Categories")
      .setDescription("Select a category to view caught Pokémon:")
      .setColor("#3498db")
      .setFooter({
        text: "Powered by Your Hoopa",
      });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pdata_legendary")
        .setLabel("Legendary")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("pdata_shiny")
        .setLabel("Shiny")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pdata_mythical")
        .setLabel("Mythical")
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pdata_ultrabeast")
        .setLabel("Ultra Beast")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pdata_rareiv")
        .setLabel("Rare IV")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("pdata_event")
        .setLabel("Event")
        .setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pdata_all")
        .setLabel("All Pokemon")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pdata_regional")
        .setLabel("Regional")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
  } else if (interaction.customId === "refresh_stats") {
    await statMsg(interaction, 0);
  } else if (interaction.customId === "refresh_tokens") {
    // Refresh the token list by regenerating the embed and components
    const currentPage = 0; // Reset to first page
    const embed = generateTokenEmbed(currentPage, autocatchers);
    const components = generatePaginationButtons(currentPage, autocatchers);
    await interaction.update({ embeds: [embed], components: components });
  }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "addTokenModal") {
      await handleAddTokenModal(interaction);
    } else if (interaction.customId === "addTokensBulkModal") {
      await handleAddTokensBulkModal(interaction);
    } else if (interaction.customId === "removeTokenModal") {
      await handleRemoveTokenModal(interaction);
    } else if (interaction.customId.startsWith("market_buy_modal")) {
      await handleMarketPurchase(interaction, autocatchers);
    }
  }
});


function generateTokenEmbed(currentPage, autocatchers) {
  const start = currentPage * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const tokensToShow = autocatchers.slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle(`Token List - Page ${currentPage + 1}`)
    .setColor("#90EE90")
    .setTimestamp();

  if (tokensToShow.length === 0) {
    embed.setDescription("No tokens available.");
  } else {
    tokensToShow.forEach((ac, index) => {
      const user = ac.client.user;
      const username = user ? user.tag : "Unknown User"; // Ensure username is fetched correctly
      embed.addFields({
        name: `Token ${start + index + 1}`,
        value: `**Username**: **${username}**\n**Token**: \`\`\`${ac.token || "No token provided"}\`\`\``, // Ensure token is handled correctly
        inline: false,
      });
    });
  }

  return embed;
}
function generatePaginationButtons(currentPage, autocatchers) {
  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`previous_${currentPage}`)
          .setLabel('◀ Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId(`refresh_tokens`)
          .setLabel('🔄')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`next_${currentPage}`)
          .setLabel('Next ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled((currentPage + 1) * PAGE_SIZE >= autocatchers.length)
      )
  ];
}

async function handleTokenPageNavigation(interaction) {
  const args = interaction.customId.split("_");
  let currentPage = parseInt(args[1]);

  if (interaction.customId.startsWith("previous")) {
    if (currentPage > 0) currentPage--;
  } else if (interaction.customId.startsWith("next")) {
    if ((currentPage + 1) * PAGE_SIZE < autocatchers.length) currentPage++;
  } else {
    return;
  }

  // Generate the updated embed
  const embed = generateTokenEmbed(currentPage, autocatchers);

  // Update the existing message with the new embed and buttons
  await interaction.update({
    embeds: [embed],
    components: generatePaginationButtons(currentPage, autocatchers),
  });

  // Clear buttons after 1 minute
  setTimeout(async () => {
    try {
      const fetchedMessage = await interaction.message.fetch();
      await fetchedMessage.edit({ components: [] }); // Clear buttons
    } catch (error) {
      console.error("Error clearing buttons:", error);
    }
  }, 60000);
}

async function handlePageNavigation(interaction) {
  const args = interaction.customId.split("-");
  const currentPage = parseInt(args[2]);
  const direction = args[1] === "L" ? -1 : 1;
  const newPage = currentPage + direction;
  await statMsg(interaction, newPage);
}

async function showAddTokenModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('addTokenModal')
    .setTitle('Add Token(s)');

  const tokenInput = new TextInputBuilder()
    .setCustomId('tokenInput')
    .setLabel("Token(s)")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      "Enter token(s) one per line\n" +
      "Supports formats:\n" +
      "- Standalone token\n" +
      "- mail:password:token"
    )
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}



async function showRemoveTokenModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('removeTokenModal')
    .setTitle('Remove Token');

  const tokenInput = new TextInputBuilder()
    .setCustomId('tokenInput')
    .setLabel("Discord Bot Token to Remove")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Enter the token you want to remove...")
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

async function handleAddTokenModal(interaction) {
  const tokensText = interaction.fields.getTextInputValue('tokenInput');

  // Check if already replied or deferred
  if (interaction.replied || interaction.deferred) {
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    // Split the input by new lines and filter out empty lines
    const tokenLines = tokensText.split(/\r?\n/).filter(line => line.trim() !== '');

    let successCount = 0;
    let totalCount = 0;
    const results = [];

    // Process each line to extract tokens
    for (const line of tokenLines) {
      totalCount++;
      
      // Extract token from different possible formats
      let token = null;
      
      // Check for email:password:token or mail:password:token format
      if (line.includes(':')) {
        const parts = line.split(':');
        if (parts.length >= 3) {
          token = parts[2]; // The token is the third part
        }
      } else {
        // Assume it's a standalone token
        token = line.trim();
      }
      
      if (token) {
        // Clean the token
        token = token.trim();
        
        // Add token using the existing addToken function
        await new Promise(resolve => {
          addToken(token, (res, success) => {
            if (success) {
              successCount++;
              // Extract username from the success message
              const usernameMatch = res.match(/Logged in as ([^\n]+)/);
              const username = usernameMatch ? usernameMatch[1] : `User with token ...${token.slice(-5)}`;
              results.push(`✅ Logged in as ${username} with token ...${token.slice(-5)}`);
            } else {
              results.push(`❌ Failed to add token ending in ...${token.slice(-5)}: ${res}`);
            }
            resolve();
          });
        });
        
        // Small delay between adding tokens to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        results.push(`❌ Invalid format for line: ${line}`);
      }
    }

    const response = `Added ${successCount}/${totalCount} tokens successfully!\n\n${results.join('\n')}`;
    
    await interaction.editReply({
      content: response.length > 2000 ? response.substring(0, 2000) + '\n...(truncated)' : response
    });
  } catch (error) {
    console.log('Error in token addition:', error.message);
    await interaction.editReply({
      content: `❌ An error occurred while adding tokens: ${error.message}`
    });
  }
}

async function handleAddTokensBulkModal(interaction) {
  const tokensText = interaction.fields.getTextInputValue('tokensInput');

  // Check if already replied or deferred
  if (interaction.replied || interaction.deferred) {
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    // Split the input by new lines and filter out empty lines
    const tokenLines = tokensText.split(/\r?\n/).filter(line => line.trim() !== '');

    let successCount = 0;
    let totalCount = 0;
    const results = [];

    // Process each line to extract tokens
    for (const line of tokenLines) {
      totalCount++;
      
      // Extract token from different possible formats
      let token = null;
      
      // Check for email:password:token or mail:password:token format
      if (line.includes(':')) {
        const parts = line.split(':');
        if (parts.length >= 3) {
          token = parts[2]; // The token is the third part
        }
      } else {
        // Assume it's a standalone token
        token = line.trim();
      }
      
      if (token) {
        // Clean the token
        token = token.trim();
        
        // Add token using the existing addToken function
        await new Promise(resolve => {
          addToken(token, (res, success) => {
            if (success) {
              successCount++;
              results.push(`✅ Added token ending in ...${token.slice(-5)}`);
            } else {
              results.push(`❌ Failed to add token ending in ...${token.slice(-5)}: ${res}`);
            }
            resolve();
          });
        });
        
        // Small delay between adding tokens to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        results.push(`❌ Invalid format for line: ${line}`);
      }
    }

    const response = `Added ${successCount}/${totalCount} tokens successfully!\n\n${results.join('\n')}`;
    
    await interaction.editReply({
      content: response.length > 2000 ? response.substring(0, 2000) + '\n...(truncated)' : response
    });
  } catch (error) {
    console.log('Error in bulk token addition:', error.message);
    await interaction.editReply({
      content: `❌ An error occurred while adding tokens: ${error.message}`
    });
  }
}

async function handleRemoveTokenModal(interaction) {
  const token = interaction.fields.getTextInputValue('tokenInput');

  // Check if already replied or deferred
  if (interaction.replied || interaction.deferred) {
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    removeToken(token, async (res, success) => {
      try {
        // Check if interaction is still valid before editing
        if (!interaction.replied && !interaction.editReply) {
          console.log("Interaction no longer valid for editing");
          return;
        }

        await interaction.editReply({
          content: res
        });
      } catch (error) {
        console.log("Error editing reply:", error.message);
      }
    });
  } catch (error) {
    console.log("Error deferring reply:", error.message);
  }
}

bot.login(config.botToken);

bot.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix)) return;

  if (!owners.includes(message.author.id)) {
    await message.reply("You are not authorised to use this command!");
    return;
  }

  let [command, ...args] = message.content
    .slice(prefix.length)
    .trim()
    .split(/\s+/);
  command = command.toLowerCase();
  args = args.map((x) => x.toLowerCase());

  if (command === "ping") {
    const startTime = Date.now();
    const m = await message.reply("Pinging...");
    const ping = Date.now() - startTime;
    await m.edit(`Pinged with **${ping}ms!**`);
  } else if (command === "stats") {
    await statMsg(message, 0);
  } else if (command == `pokemon` || command == `pdata`) {
    if (autocatchers.length === 0) {
      return message.reply("No autocatchers are running!");
    }

    // Create pokemon data selection embed
    const embed = new EmbedBuilder()
      .setTitle("🗃️ Pokémon Data Categories")
      .setDescription("Select a category to view caught Pokémon:")
      .setColor("#3498db")
      .setFooter({
        text: "Powered by Your Hoopa",
      });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pdata_legendary")
        .setLabel("Legendary")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("pdata_shiny")
        .setLabel("Shiny")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pdata_mythical")
        .setLabel("Mythical")
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pdata_ultrabeast")
        .setLabel("Ultra Beast")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pdata_rareiv")
        .setLabel("Rare IV")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("pdata_event")
        .setLabel("Event")
        .setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pdata_all")
        .setLabel("All Pokemon")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pdata_regional")
        .setLabel("Regional")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row1, row2, row3] });
  } else if (command === "reload") {
   const MAX_FIELD_LENGTH = 1024;
const MAX_FIELDS_PER_EMBED = 25; // Discord allows up to 25 fields per embed

function chunkText(text, maxLength) {
  const chunks = [];
  let currentChunk = '';

  text.split('\n').forEach(line => {
    const newChunk = currentChunk + line + '\n';
    if (newChunk.length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = line + '\n';
    } else {
      currentChunk = newChunk;
    }
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function createEmbeds(fields) {
  const embeds = [];
  for (let i = 0; i < fields.length; i += MAX_FIELDS_PER_EMBED) {
    const embed = new EmbedBuilder()
      .setTitle("Currently Connected")
      .setColor("#1E90FF")
      .setTimestamp();

    fields.slice(i, i + MAX_FIELDS_PER_EMBED).forEach((field, index) => {
      embed.addFields({
        name: `Field ${i + index + 1}`,
        value: field,
      });
    });

    embeds.push(embed);
  }

  return embeds;
}

try {
  await stop();
  const logs = await start();

  if (!logs || logs.length === 0) {
    await message.channel.send("***Successfully reloaded 0 tokens...***");
  } else {
    await message.channel.send(
      `***Successfully reloaded ${logs.length} tokens...***`
    );

    const formattedLogs = logs
      .map((log, index) => `${index + 1}. 🔹 ${log}`)
      .join('\n');

    const logChunks = chunkText(formattedLogs, MAX_FIELD_LENGTH);
    const embeds = createEmbeds(logChunks);

    embeds.forEach(embed => {
      message.channel.send({ embeds: [embed] });
    });
  }
} catch (error) {
  console.error("Error during reload:", error);
  await message.channel.send("❌ Failed to reload. Please check the logs.");
}
  } else if (command === "add-token") {
    const token = message.content.split(" ")[1];
    if (!token) {
      await message.reply("***Please provide a token to add.***");
      return;
    }

    let replyMessage = await message.reply(`*Attempting to add token...*`);

    addToken(token, (res, success) => {
      replyMessage.edit(
        `${success ? `✅ Added token!` : `❌ Unable to add token!`}\n` +
          "```ansi\n" +
          res +
          "```"
      );
    });
  } else if (command == `captcha`) {
    let id = args[0];
    if (!id) {
    return message.reply(
      `❌ Please provide an ID or use 'start/stop' for global control!\n` +
      `Usage: \`${prefix}captcha <id> start/stop\` or \`${prefix}captcha start/stop\``
    );
  }

    id = id.toLowerCase();
    if (id === "start" || id === "stop") {
    const shouldSolve = id === "start"; 
    for (let i = 0; i < autocatchers.length; i++) {
      autocatchers[i].captcha = !shouldSolve;
    }   
    return message.reply(
      `✅ Successfully ${shouldSolve ? "enabled" : "disabled"} automatic captcha solving globally!`
    );
  }

  const ac = autocatchers.find((x) => x.client.user.id === id);
  if (!ac) {
    return message.reply("❌ Unable to locate that bot!");
  }
      
    if (!args[1]) {
    return message.reply(
      `❌ Please provide an action!\nUsage: \`${prefix}captcha ${id} start/stop\``
    );
  }

  const action = args[1].toLowerCase();
  if (action !== "start" && action !== "stop") {
    return message.reply("❌ Invalid action! Use `start` or `stop`");
  }

  const shouldSolve = action === "start";
  ac.captcha = !shouldSolve; // Note: captcha flag is inverted

  return message.reply(
    `✅ Successfully ${shouldSolve ? "enabled" : "disabled"} automatic captcha solving for **${
      ac.client.user.globalName || ac.client.user.displayName
    }** (${ac.client.user.id})!\n`
  );
} else if (command === "clear" || command === "reset") {
  if (autocatchers.length === 0) {
    return message.reply("ℹ️ No tokens to clear!");
  }

  const confirmEmbed = new EmbedBuilder()
    .setTitle("⚠️ CLEAR ALL TOKENS")
    .setDescription(
      `**Are you sure you want to delete ALL tokens?**\n\n` +
      `📊 **Current Status:**\n` +
      `• Active Bots: ${autocatchers.length}\n` +
      `• Connected Users: ${autocatchers.map(ac => ac.client.user.tag).join(", ")}\n\n` +
      `⚠️ **This action will:**\n` +
      `• Stop all accounts\n` +
      `• Remove all tokens from saved data\n` +
      `• Cannot be undone!\n\n` +
      `**Click CONFIRM to proceed or CANCEL to abort.**`
    )
    .setColor("#FF0000")
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirmclear_${message.author.id}`)
      .setLabel("✅ CONFIRM")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`cancelclear_${message.author.id}`)
      .setLabel("❌ CANCEL")
      .setStyle(ButtonStyle.Secondary)
  );

  const confirmMsg = await message.channel.send({
    embeds: [confirmEmbed],
    components: [row],
  });

  // Create button collector
  const collector = confirmMsg.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 30000,
    max: 1,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === `confirmclear_${message.author.id}`) {
      try {
        const botCount = autocatchers.length;
        
        // Stop all autocatchers first
        await stop();
        log(`🛑 Stopped ${botCount} bots`.yellow);

        // ✅ FIX: Use correct path data/tokens.json
        const tokensPath = path.join(__dirname, "data", "tokens.json");
        
        // Check if file exists
        if (fs.existsSync(tokensPath)) {
          // Delete the old file
          fs.unlinkSync(tokensPath);
          log(`🗑️ Deleted old tokens.json`.red);
        }
        
        // Create new empty tokens.json with []
        fs.writeFileSync(tokensPath, JSON.stringify([], null, 2), 'utf8');
        log(`✅ Created new empty data/tokens.json`.green);

        const successEmbed = new EmbedBuilder()
          .setTitle("✅ Tokens Cleared Successfully")
          .setDescription(
            `🗑️ All tokens have been removed!\n\n` +
            `• Stopped ${botCount} bots\n` +
            `• All autocatchers terminated\n\n` +
            `Use \`${prefix}add-token\` to add new tokens.`
          )
          .setColor("#00FF00")
          .setTimestamp();

        await interaction.update({
          embeds: [successEmbed],
          components: [],
        });

        log(`🗑️ All tokens cleared by ${message.author.tag}`.red);
      } catch (error) {
        console.error("Error clearing tokens:", error);
        await interaction.update({
          content: `❌ Error clearing tokens: ${error.message}\n\`\`\`${error.stack}\`\`\``,
          embeds: [],
          components: [],
        });
      }
    } else if (interaction.customId === `cancelclear_${message.author.id}`) {
      const cancelEmbed = new EmbedBuilder()
        .setTitle("❌ Operation Cancelled")
        .setDescription("Token clearing has been cancelled. No changes were made.")
        .setColor("#FFA500")
        .setTimestamp();

      await interaction.update({
        embeds: [cancelEmbed],
        components: [],
      });
    }
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      const timeoutEmbed = new EmbedBuilder()
        .setTitle("⏱️ Operation Timed Out")
        .setDescription("Token clearing confirmation timed out. No changes were made.")
        .setColor("#808080")
        .setTimestamp();

      try {
        await confirmMsg.edit({
          embeds: [timeoutEmbed],
          components: [],
        });
      } catch (error) {
        console.error("Error editing timeout message:", error);
      }
    }
  });
} else if (command == `catcher`) {
    let id = args[0];
    if (!id) {
    return message.reply(
      `❌ Please provide an ID or use 'start/stop' for global control!\n` +
      `Usage: \`${prefix}catcher <id> start/stop\` or \`${prefix}catcher start/stop\``
    );
  }
    id = id.toLowerCase();
    if (id === "start" || id === "stop") {
      const shouldCatch = id === "start";   
      for (let i = 0; i < autocatchers.length; i++) {
      autocatchers[i].catch = shouldCatch;
    }
    return message.reply(
      `✅ Successfully ${shouldCatch ? "started" : "stopped"} catching globally for all bots!`
    );
  }

  const ac = autocatchers.find((x) => x.client.user.id === id);
  if (!ac) {
    // Debug: Show available IDs
    const availableIds = autocatchers.map(x => `${x.client.user.tag} (${x.client.user.id})`).join("\n• ");
    return message.reply(
      `❌ Unable to locate that bot!\n\n` +
      `**You provided:** \`${id}\`\n\n` +
      `**Available bots:**\n• ${availableIds || "None"}`
    );
  }

    if (!args[1]) {
    return message.reply(
      `❌ Please provide an action!\nUsage: \`${prefix}catcher ${id} start/stop\``
    );
  }
      
    const action = args[1].toLowerCase();
  if (action !== "start" && action !== "stop") {
    return message.reply("❌ Invalid action! Use `start` or `stop`");
  }

  const shouldCatch = action === "start";
  ac.catch = shouldCatch;

  return message.reply(
    `✅ Successfully ${shouldCatch ? "started" : "stopped"} catching for **${
      ac.client.user.globalName || ac.client.user.displayName 
    }** (${ac.client.user.id})!`
  );
} else if (command == `ai-catch`) {
    let id = args[0];
    if (!id) {
    return message.reply(
      `❌ Please provide an ID or use 'start/stop' for global control!\n` +
      `Usage: \`${prefix}ai-catch <id> start/stop\` or \`${prefix}ai-catch start/stop\``
    );
  }

    id = id.toLowerCase();
    if (id === "start" || id === "stop") {
    const shouldUseAI = id === "start";
        
      for (let i = 0; i < autocatchers.length; i++) {
      autocatchers[i].aiCatch = shouldUseAI;
    }
    
    return message.reply(
      `✅ Successfully ${shouldUseAI ? "enabled" : "disabled"} AI catching globally for all bots!`
    );
  }

  const ac = autocatchers.find((x) => x.client.user.id === id);
  if (!ac) {
    return message.reply("❌ Unable to locate that bot!");
  }

    if (!args[1]) {
    return message.reply(
      `❌ Please provide an action!\nUsage: \`${prefix}ai-catch ${id} start/stop\``
    );
  }
    const action = args[1].toLowerCase();
  if (action !== "start" && action !== "stop") {
    return message.reply("❌ Invalid action! Use `start` or `stop`");
  }
  const shouldUseAI = action === "start";
  ac.aiCatch = shouldUseAI;
  return message.reply(
    `✅ Successfully ${shouldUseAI ? "enabled" : "disabled"} AI catching for **${
      ac.client.user.globalName || ac.client.user.displayName
    }** (${ac.client.user.id})!`
  );
} else if (command === "set-prefix") {
    const new_prefix = message.content.split(" ")[1];
    if (!new_prefix) {
      return message.reply(`Please provide me a **new prefix** to change.`);
    }
    prefix = new_prefix;
    await message.reply(`Successfully changed prefix to ${new_prefix}`);
  } else if (command === "owner") {
    let id = args[0];
    if (!id) {
      await message.reply(
        `Please provide an ID!\n\`${prefix}owner <id> <add/remove>\``
      );
      return;
    }
    if (isNaN(id)) return message.reply(`Please provide a valid ID!`);

    const isOwner = owners.includes(id);

    if (!args[1]) {
      return message.reply(`Please provide an action! => \`<add/remove>\``);
    }

    if (args[1] === "add") {
      if (isOwner) {
        return message.reply(`ID ${id} is already an owner.`);
      }
      owners.push(id);
      await message.reply(
        `Successfully **added** <@${id}> to **Owners whitelist**`
      );
    } else if (args[1] === "remove") {
      if (!isOwner) {
        return message.reply(`ID ${id} is not in the owners list.`);
      }
      owners = owners.filter((ownerId) => ownerId !== id);
      await message.reply(`Successfully **removed** ID ${id} from owners.`);
    } else {
      await message.reply(
        `Invalid action! Please use \`<add/remove>\` as the second argument.`
      );
    }
  } else if (command === "current-tokens") {
    const currentPage = 0;
    const embed = generateTokenEmbed(currentPage, autocatchers);
    const components = generatePaginationButtons(currentPage, autocatchers);

    await message.channel.send({
      embeds: [embed],
      components: components,
    });
  } else if (command === "mpanel") {
    await showMarketPanel(message, autocatchers);
  } else if (command === "solver") {
    // Parse the command properly - split by spaces but handle token and userid separately
    const commandParts = message.content.slice(prefix.length).trim().split(/\s+/);

    if (commandParts.length < 3) {
      return message.reply("❌ Please provide both token and user ID!\nUsage: `$solver <token> <userid>`");
    }

    const token = commandParts[1]; // Get the token (2nd part)
    const userId = commandParts[2]; // Get the user ID (3rd part)

    console.log(`🔍 Solver Test Debug:`);
    console.log(`   Token: ${token}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   API Key: ${config.captchaApiKey}`);
    console.log(`   Hostname: ${config.captchaApiHostname}`);

    try {
      await message.reply("🔄 Testing captcha solver...");

      // Send captcha detected message
      await sendCaptchaMessage("Test User", userId, "detected");

      const startTime = Date.now();
      const result = await solveCaptcha(token, userId);
      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(3) + "s";

      // Log the full response for debugging
      console.log(`🎯 Captcha Solver Response:`, JSON.stringify(result, null, 2));

      if (result.success) {
        await sendCaptchaMessage("Test User", userId, "solved", "Hoopa Captcha Solver", timeTaken);
        await message.reply(`✅ **Captcha solver test successful!**\nSolved in: ${timeTaken}\nResult: ${result.result}`);
      } else {
        await sendCaptchaMessage("Test User", userId, "failed", "Hoopa Captcha Solver");
        await message.reply(`❌ **Captcha solver test failed!**\nError: ${result.error || 'Unknown error'}\nFull response logged to console.`);
      }
    } catch (error) {
      console.error(`💥 Captcha solver exception:`, error);
      await sendCaptchaMessage("Test User", userId, "failed", "Hoopa Captcha Solver");
      await message.reply(`❌ **Error testing captcha solver:**\n${error.message}`);
    }
  } else if (command === "test-ai") {
    const testImageUrl = args[0];
    if (!testImageUrl) {
      return message.reply("Please provide an image URL to test AI catching!");
    }

    try {
      const { getNamee } = require("./utils/api");
      const result = await getNamee(testImageUrl);

      if (result && !result.error && result.prediction) {
        const confidence = (result.confidence * 100) || 0;
        await message.reply(`✅ AI Test Successful!\nPokemon: ${result.prediction}\nConfidence: ${confidence.toFixed(2)}%`);
      } else {
        await message.reply(`❌ AI Test Failed!\nError: ${result.error || 'No prediction returned'}\nFull response: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      await message.reply(`❌ AI Test Error: ${error.message}`);
    }
  } else if (command === "balance") {
    try {
      const result = await checkApiKeyBalance();

      if (result.success) {
        const embed = new EmbedBuilder()
          .setTitle("🔑 Solver Key Balance")
          .setColor(0x5865F2)
          .setDescription(`\`\`\`yml\nKey: ${result.key.substring(0, 4)}...\`\`\``)
          .addFields(
          { 
            name: "💎 Remaining Solves", 
            value: `\`\`\`fix\n${result.remaining.toLocaleString()}/${result.solvesAllowed}\`\`\``, 
            inline: true 
          },
          { 
            name: "📈 Solves Used", 
            value: `\`\`\`diff\n- ${result.solvesUsed.toLocaleString()}\`\`\``, 
            inline: true 
          },
          { 
            name: "📅 Key Created", 
            value: `\`\`\`${new Date(result.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}\`\`\``, 
            inline: true 
          }
        )
        .setFooter({ text: "Momento Captcha Solver API" })
        .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      } else {
        await message.reply(`❌ **Failed to check API balance:**\n${result.error}`);
      }
    } catch (error) {
      await message.reply(`❌ **Error checking API balance:**\n${error.message}`);
    }
  } else if (command === "support") {
    const embed = new EmbedBuilder()
      .setTitle("🛠️ Need Support?")
      .setColor("#00BFFF")
      .setThumbnail(bot.user.displayAvatarURL())
      .setDescription(
        "Need help with **Zeta AutoCatcher**? Join our support server for assistance!\n\n" +
        "📋 **Support Available For:**\n" +
        "• Setup and Configuration\n" +
        "• Token Management Issues\n" +
        "• Captcha Solver Problems\n" +
        "• Feature Requests\n" +
        "• Bug Reports\n\n" +
        "💳 **Buy Captcha Solver Keys:**\n" +
        "👉 [graceshop by Momento](https://graceshop.mysellauth.com/)\n\n" +
        "**Join our Discord Server:**\n" +
        "👉 [Click Here to Join Support Server](https://discord.gg/BgGmu4RgUJ)\n\n" +
        "_Our support team is ready to help you get the most out of Zeta AutoCatcher!_"
      )
      .setFooter({ 
        text: "Zeta AutoCatcher Support",
        iconURL: bot.user.displayAvatarURL()
      })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } else if (command === "help") {
    const embed = createHelpEmbed(prefix, bot.user);
    await message.channel.send({ embeds: [embed] });
  }
});