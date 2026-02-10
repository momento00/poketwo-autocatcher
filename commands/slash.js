const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../config');
const { statMsg, start, stop, autocatchers } = require('../functions/functions');
const { showMarketPanel } = require('../functions/market');
const { solveCaptcha } = require('../utils/api');
const { checkApiKeyBalance } = require('../utils/api');
const { createHelpEmbed } = require('../utils/utils');

// ==================== HELP MENU FUNCTION ====================
async function showHelpMenu(interaction, type = 'bot') {
  const isInteraction = !interaction.author;
  
  if (type === 'bot') {
    const embed = new EmbedBuilder()
      .setTitle('Bot Commands')
      .setDescription('All available slash commands for the bot.')
      .addFields(
        {
          name: 'System Commands',
          value: '`/ping` - Check bot latency\n' +
                 '`/help` - Display this help menu\n' +
                 '`/support` - Get support information\n' +
                 '`/reload` - Reload all tokens and restart autocatchers\n' +
                 '`/setprefix` - Change command prefix\n' +
                 '`/owner` - Add or remove bot owners',
          inline: false
        },
        {
          name: 'Statistics & Data',
          value: '`/stats` - View autocatcher statistics\n' +
                 '`/pokemon` - View caught Pokémon by category\n' +
                 '`/balance` - Check captcha solver API balance',
          inline: false
        },
        {
          name: 'Token Management',
          value: '`/token` - Add, remove, or check tokens\n' +
                 '`/viewtokens` - View all connected tokens',
          inline: false
        },
        {
          name: 'Market & Purchases',
          value: '`/mpanel` - Open market panel for buying Pokémon\n' +
                 '`/shards` - Buy shards across all autocatchers\n' +
                 '`/incense` - Buy incense across all autocatchers',
          inline: false
        },
        {
          name: 'Captcha Management',
          value: '`/solver` - Test or solve captcha manually\n' +
                 '`/captcha` - Toggle captcha solver on/off',
          inline: false
        },
        {
          name: 'Services',
          value: '**Captcha Solves:** [graceshop.mysellauth.com](https://graceshop.mysellauth.com)\n' +
                 '**AI Catching:** DM momento.de (99.7%+ accuracy)\n' +
                 '**Support:** [Support Server](https://discord.gg/BgGmu4RgUJ)',
          inline: false
        }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Zeta AutoCatcher • Bot Commands' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_bot')
        .setLabel('Bot Commands')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('help_selfbot')
        .setLabel('Selfbot Commands')
        .setStyle(ButtonStyle.Secondary)
    );

    if (isInteraction) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row] });
      }
    } else {
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  } else {
    const embed = new EmbedBuilder()
      .setTitle('Selfbot Commands')
      .setDescription('All available selfbot commands. Prefix: `.`')
      .addFields(
        {
          name: 'Public Commands',
          value: '`.resume` or `.solved` - Resume catching if paused (any user can use)',
          inline: false
        },
        {
          name: 'Owner Only Commands',
          value: '`.click [button] [row]` - Click buttons on replied message\n' +
                 '`.say <message>` - Send a message (use p2 for @Pokétwo)\n' +
                 '`.bal` - Check Pokétwo balance\n' +
                 '`.incense` - Buy 1 day incense with 20s interval\n' +
                 '`.mbuy <id>` - Buy Pokémon from market by ID',
          inline: false
        },
        {
          name: 'Services',
          value: '**Captcha Solves:** [graceshop.mysellauth.com](https://graceshop.mysellauth.com)\n' +
                 '**AI Catching:** DM momento.de (99.7%+ accuracy)\n' +
                 '**Support:** [Support Server](https://discord.gg/BgGmu4RgUJ)',
          inline: false
        }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Zeta AutoCatcher • Selfbot Commands' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_bot')
        .setLabel('Bot Commands')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_selfbot')
        .setLabel('Selfbot Commands')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );

    if (isInteraction) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row] });
      }
    } else {
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }
}

// ==================== PING COMMAND ====================
const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const startTime = Date.now();
    
    const embed = new EmbedBuilder()
      .setTitle('Network Latency Check')
      .setDescription('Measuring response time...')
      .setColor('#5865F2')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
    const ping = Date.now() - startTime;
    
    const updatedEmbed = new EmbedBuilder()
      .setTitle('Network Latency')
      .addFields(
        { name: 'Response Time', value: `${ping}ms`, inline: true },
        { name: 'Status', value: ping < 100 ? 'Excellent' : ping < 200 ? 'Good' : 'Fair', inline: true }
      )
      .setColor(ping < 100 ? '#57F287' : ping < 200 ? '#FEE75C' : '#ED4245')
      .setTimestamp();
    
    await interaction.editReply({ embeds: [updatedEmbed] });
  },
};

// ==================== STATS COMMAND ====================
const statsCommand = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View autocatcher statistics')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    await statMsg(interaction, 0);
  },
};

// ==================== POKEMON COMMAND ====================
const pokemonCommand = {
  data: new SlashCommandBuilder()
    .setName('pokemon')
    .setDescription('View caught Pokémon data by category')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    if (autocatchers.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('Pokémon Data')
        .setDescription('No autocatchers are currently running.')
        .setColor('#ED4245')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setTitle('Pokémon Data Categories')
      .setDescription('Select a category to view your caught Pokémon collection.')
      .setColor('#5865F2')
      .setFooter({ text: 'Autocatcher Statistics' })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pdata_legendary')
        .setLabel('Legendary')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('pdata_shiny')
        .setLabel('Shiny')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('pdata_mythical')
        .setLabel('Mythical')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pdata_ultrabeast')
        .setLabel('Ultra Beast')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('pdata_rareiv')
        .setLabel('Rare IV')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('pdata_event')
        .setLabel('Event')
        .setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pdata_all')
        .setLabel('All Pokemon')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('pdata_regional')
        .setLabel('Regional')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('pdata_gigantamax')
        .setLabel('Gigantamax')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2, row3], flags: MessageFlags.Ephemeral });
  },
};

// ==================== RELOAD COMMAND ====================
const reloadCommand = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload all tokens and restart autocatchers')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const MAX_FIELD_LENGTH = 1024;
    const MAX_FIELDS_PER_EMBED = 25;

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
          .setTitle('Currently Connected')
          .setColor('#1E90FF')
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
      await interaction.deferReply();
      
      const loadingEmbed = new EmbedBuilder()
        .setTitle('Token Reload')
        .setDescription('Stopping all active connections...')
        .setColor('#FEE75C')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [loadingEmbed] });
      
      await stop();
      const logs = await start();

      if (!logs || logs.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('Reload Complete')
          .setDescription('No tokens were reloaded.')
          .setColor('#ED4245')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle('Reload Successful')
          .setDescription(`Successfully reloaded **${logs.length}** token(s)`)
          .setColor('#57F287')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });

        const formattedLogs = logs
          .map((log, index) => `${index + 1}. ${log}`)
          .join('\n');

        const logChunks = chunkText(formattedLogs, MAX_FIELD_LENGTH);
        const embeds = createEmbeds(logChunks);

        for (const embed of embeds) {
          await interaction.followUp({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error('Error during reload:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('Reload Failed')
        .setDescription('An error occurred during the reload process.')
        .addFields({ name: 'Error', value: error.message || 'Unknown error' })
        .setColor('#ED4245')
        .setTimestamp();
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

// ==================== TOKEN COMMAND ====================
const tokenCommand = {
  data: new SlashCommandBuilder()
    .setName('token')
    .setDescription('Manage tokens')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' },
          { name: 'Check', value: 'check' }
        ))
    .addStringOption(option =>
      option.setName('tokens')
        .setDescription('Token(s) separated by newline, comma, or space (max 25). Formats: standalone or mail:pass:token')
        .setRequired(true))
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    try {
      // Defer reply IMMEDIATELY to avoid timeout (must be within 3 seconds)
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
      
      const { addToken, removeToken, autocatchers } = require('../functions/functions');
      const action = interaction.options.getString('action');
      const tokensInput = interaction.options.getString('tokens');

    // Helper function to parse tokens from input
    function parseTokens(input) {
      if (!input) return [];
      
      // First, split by newlines
      let lines = input.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
      
      // If we have multiple lines, return them as-is
      if (lines.length > 1) {
        return lines;
      }
      
      // If only one line, check if it contains multiple tokens separated by comma or space
      if (lines.length === 1) {
        const singleLine = lines[0];
        
        // Try splitting by comma first
        if (singleLine.includes(',')) {
          return singleLine.split(',').map(t => t.trim()).filter(t => t !== '');
        }
        
        // Try splitting by space - but be careful with mail:pass:token format
        // Count colons to determine if it's a single token or multiple
        const colonCount = (singleLine.match(/:/g) || []).length;
        
        // If there are 2 colons, it's likely mail:pass:token format (single token)
        if (colonCount === 2) {
          return [singleLine];
        }
        
        // If there are more than 2 colons or spaces, try splitting by space
        if (singleLine.includes(' ')) {
          const spaceParts = singleLine.split(/\s+/).map(t => t.trim()).filter(t => t !== '');
          // Only split if we have multiple valid-looking tokens
          if (spaceParts.length > 1 && spaceParts.every(p => p.length > 20)) {
            return spaceParts;
          }
        }
        
        // Otherwise, treat as single token
        return [singleLine];
      }
      
      return lines;
    }

    // Helper function to extract token from various formats
    function extractToken(line) {
      if (!line) return null;
      
      line = line.trim();
      
      // Check for mail:pass:token format
      if (line.includes(':')) {
        const parts = line.split(':');
        if (parts.length >= 3) {
          // mail:pass:token format - token is the third part
          return parts[2].trim();
        } else if (parts.length === 1) {
          // Just a token with no colons somehow split
          return parts[0].trim();
        }
      }
      
      // Standalone token
      return line.trim();
    }

    if (action === 'check') {
      // Parse tokens from input
      const tokenLines = parseTokens(tokensInput);

      if (tokenLines.length > 25) {
        const embed = new EmbedBuilder()
          .setTitle('Limit Exceeded')
          .setDescription('You can only check up to 25 accounts at a time.')
          .addFields(
            { name: 'Maximum', value: '25 accounts', inline: true },
            { name: 'Provided', value: `${tokenLines.length} tokens`, inline: true }
          )
          .setColor('#ED4245')
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      const results = [];
      const { Client } = require('discord.js-selfbot-v13');

      for (const line of tokenLines) {
        const token = extractToken(line);

        if (!token || token.length < 50) {
          results.push(`\`...\` Invalid format or too short`);
          continue;
        }

        const tokenLast10 = token.slice(-10);

        try {
          const testClient = new Client({ checkUpdate: false });
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              testClient.destroy();
              reject(new Error('Timeout'));
            }, 10000);

            testClient.once('ready', async () => {
              clearTimeout(timeout);
              
              try {
                const user = testClient.user;
                let status = '';

                // Check verification status
                if (!user.verified) {
                  status = 'Not Verified';
                } else if (user.email && user.verified) {
                  status = 'Email Verified';
                } else if (user.phone) {
                  status = 'Phone Verified';
                } else {
                  status = 'Verified';
                }

                results.push(`\`...${tokenLast10}\` • ${status}`);
                
                testClient.destroy();
                resolve();
              } catch (err) {
                testClient.destroy();
                reject(err);
              }
            });

            testClient.login(token).catch((err) => {
              clearTimeout(timeout);
              testClient.destroy();
              reject(err);
            });
          });

        } catch (error) {
          if (error.message.includes('TOKEN_INVALID') || error.message.includes('401')) {
            results.push(`\`...${tokenLast10}\` • Invalid Token`);
          } else if (error.message === 'Timeout') {
            results.push(`\`...${tokenLast10}\` • Timeout`);
          } else {
            results.push(`\`...${tokenLast10}\` • Error`);
          }
        }

        // Delay between checks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const embed = new EmbedBuilder()
        .setTitle('Verification Results')
        .setDescription(`Verified **${tokenLines.length}** token(s)`)
        .addFields({ name: 'Results', value: results.join('\n') || 'No results' })
        .setColor('#5865F2')
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Parse tokens from input
    const tokenLines = parseTokens(tokensInput);

    // Check max limit
    if (tokenLines.length > 25) {
      const embed = new EmbedBuilder()
        .setTitle('Limit Exceeded')
        .setDescription('You can only process up to 25 accounts at a time.')
        .addFields(
          { name: 'Maximum', value: '25 accounts', inline: true },
          { name: 'Provided', value: `${tokenLines.length} tokens`, inline: true }
        )
        .setColor('#ED4245')
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (action === 'add') {
      let successCount = 0;
      let totalCount = 0;
      const results = [];

      for (const line of tokenLines) {
        totalCount++;
        
        const token = extractToken(line);
        
        if (token && token.length >= 50) {
          await new Promise(resolve => {
            addToken(token, (res, success) => {
              if (success) {
                successCount++;
                const usernameMatch = res.match(/Logged in as ([^\n]+)/);
                const username = usernameMatch ? usernameMatch[1] : `Token ...${token.slice(-5)}`;
                results.push(`\`✓\` ${username}`);
              } else {
                results.push(`\`✗\` Token ...${token.slice(-5)} - ${res.substring(0, 30)}`);
              }
              resolve();
            });
          });
          
          // Delay between tokens to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          results.push(`\`✗\` Invalid format or too short`);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('Addition Complete')
        .setDescription(`Successfully added **${successCount}** out of **${totalCount}** account(s)`)
        .addFields({ name: 'Results', value: results.join('\n') || 'No results' })
        .setColor(successCount === totalCount ? '#57F287' : '#FEE75C')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });

    } else if (action === 'remove') {
      let successCount = 0;
      let totalCount = 0;
      const results = [];

      for (const line of tokenLines) {
        totalCount++;
        
        const token = extractToken(line);
        
        if (token && token.length >= 50) {
          await new Promise(resolve => {
            removeToken(token, (res, success) => {
              if (success) {
                successCount++;
                results.push(`\`✓\` Removed ...${token.slice(-5)}`);
              } else {
                results.push(`\`✗\` Token ...${token.slice(-5)} - Not found`);
              }
              resolve();
            });
          });
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          results.push(`\`✗\` Invalid format or too short`);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('Removal Complete')
        .setDescription(`Successfully removed **${successCount}** out of **${totalCount}** account(s)`)
        .addFields({ name: 'Results', value: results.join('\n') || 'No results' })
        .setColor(successCount === totalCount ? '#57F287' : '#FEE75C')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    }
    } catch (error) {
      console.error('Error in token command:', error);
      
      // Try to send error message if possible
      try {
        const errorEmbed = new EmbedBuilder()
          .setTitle('Command Error')
          .setDescription('An error occurred while processing your request.')
          .addFields({ name: 'Error', value: error.message || 'Unknown error' })
          .setColor('#ED4245')
          .setTimestamp();
        
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
      } catch (replyError) {
        console.error('Could not send error message:', replyError);
      }
    }
  },
};

// ==================== CAPTCHA COMMAND ====================
const captchaCommand = {
  data: new SlashCommandBuilder()
    .setName('captcha')
    .setDescription('Control automatic captcha solving')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Start or stop captcha solving')
        .setRequired(true)
        .addChoices(
          { name: 'Start', value: 'start' },
          { name: 'Stop', value: 'stop' }
        ))
    .addStringOption(option =>
      option.setName('id')
        .setDescription('User ID (leave empty for global control)')
        .setRequired(false))
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const id = interaction.options.getString('id');

    const shouldSolve = action === 'start';

    if (!id) {
      // Global control
      for (let i = 0; i < autocatchers.length; i++) {
        autocatchers[i].captcha = !shouldSolve;
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Captcha Solver Configuration')
        .setDescription(`Automatic captcha solving has been **${shouldSolve ? 'enabled' : 'disabled'}** globally.`)
        .addFields({ name: 'Affected Accounts', value: `${autocatchers.length} account(s)` })
        .setColor(shouldSolve ? '#57F287' : '#ED4245')
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }

    // Specific bot control
    const ac = autocatchers.find((x) => x.client.user.id === id);
    if (!ac) {
      const embed = new EmbedBuilder()
        .setTitle('Account Not Found')
        .setDescription(`Unable to locate account with ID: \`${id}\``)
        .setColor('#ED4245')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    ac.captcha = !shouldSolve;

    const embed = new EmbedBuilder()
      .setTitle('Captcha Solver Configuration')
      .setDescription(`Automatic captcha solving has been **${shouldSolve ? 'enabled' : 'disabled'}**.`)
      .addFields(
        { name: 'Account', value: ac.client.user.globalName || ac.client.user.displayName, inline: true },
        { name: 'User ID', value: ac.client.user.id, inline: true }
      )
      .setColor(shouldSolve ? '#57F287' : '#ED4245')
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};

// ==================== SETPREFIX COMMAND ====================
const setprefixCommand = {
  data: new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription('Change the bot command prefix')
    .addStringOption(option =>
      option.setName('prefix')
        .setDescription('The new prefix to use')
        .setRequired(true))
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const newPrefix = interaction.options.getString('prefix');
    config.prefix = newPrefix;
    
    const embed = new EmbedBuilder()
      .setTitle('Prefix Updated')
      .setDescription(`Command prefix has been changed to: \`${newPrefix}\``)
      .addFields({ name: 'New Prefix', value: `\`${newPrefix}\``, inline: true })
      .setColor('#57F287')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};

// ==================== OWNER COMMAND ====================
const ownerCommand = {
  data: new SlashCommandBuilder()
    .setName('owner')
    .setDescription('Manage bot owners')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Add or remove an owner')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' }
        ))
    .addStringOption(option =>
      option.setName('id')
        .setDescription('User ID to add/remove')
        .setRequired(true))
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const id = interaction.options.getString('id');

    if (action === 'add') {
      if (config.owners.includes(id)) {
        const embed = new EmbedBuilder()
          .setTitle('Owner Management')
          .setDescription(`User \`${id}\` is already an owner.`)
          .setColor('#FEE75C')
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }
      config.owners.push(id);
      
      const embed = new EmbedBuilder()
        .setTitle('Owner Added')
        .setDescription(`Successfully added user as an owner.`)
        .addFields({ name: 'User ID', value: `\`${id}\`` })
        .setColor('#57F287')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
      
    } else if (action === 'remove') {
      const index = config.owners.indexOf(id);
      if (index === -1) {
        const embed = new EmbedBuilder()
          .setTitle('Owner Management')
          .setDescription(`User \`${id}\` is not an owner.`)
          .setColor('#FEE75C')
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }
      config.owners.splice(index, 1);
      
      const embed = new EmbedBuilder()
        .setTitle('Owner Removed')
        .setDescription(`Successfully removed user from owners.`)
        .addFields({ name: 'User ID', value: `\`${id}\`` })
        .setColor('#57F287')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  },
};

// ==================== VIEWTOKENS COMMAND ====================
const viewtokensCommand = {
  data: new SlashCommandBuilder()
    .setName('viewtokens')
    .setDescription('View current tokens list')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const { generateTokenEmbed, generatePaginationButtons } = require('../index');
    
    const currentPage = 0;
    const embed = generateTokenEmbed(currentPage, autocatchers);
    const components = generatePaginationButtons(currentPage, autocatchers);

    await interaction.reply({
      embeds: [embed],
      components: components,
      flags: MessageFlags.Ephemeral
    });
  },
};

// ==================== MPANEL COMMAND ====================
const mpanelCommand = {
  data: new SlashCommandBuilder()
    .setName('mpanel')
    .setDescription('Open the market panel')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    await showMarketPanel(interaction, autocatchers);
  },
};

// ==================== SOLVER COMMAND ====================
const solverCommand = {
  data: new SlashCommandBuilder()
    .setName('solver')
    .setDescription('Test captcha solver with a token and user ID')
    .addStringOption(option =>
      option.setName('token')
        .setDescription('Bot token to test')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('User ID for testing')
        .setRequired(true))
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const token = interaction.options.getString('token');
    const userId = interaction.options.getString('userid');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const embed = new EmbedBuilder()
        .setTitle('Captcha Solver Test')
        .setDescription('Testing captcha solver...')
        .setColor('#5865F2')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });

      const result = await solveCaptcha(token, userId);

      if (result.success) {
        const successEmbed = new EmbedBuilder()
          .setTitle('Captcha Solver Test Successful')
          .addFields(
            { name: 'Solution', value: `\`${result.solution}\``, inline: false },
            { name: 'Time Taken', value: `${result.timeTaken}ms`, inline: true },
            { name: 'Confidence', value: result.confidence || 'N/A', inline: true }
          )
          .setColor('#57F287')
          .setTimestamp();
        await interaction.editReply({ embeds: [successEmbed] });
      } else {
        const errorEmbed = new EmbedBuilder()
          .setTitle('Captcha Solver Test Failed')
          .setDescription(result.error || 'Unknown error occurred')
          .setColor('#ED4245')
          .setTimestamp();
        await interaction.editReply({ embeds: [errorEmbed] });
      }
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Captcha Solver Error')
        .setDescription(error.message || 'An unexpected error occurred')
        .setColor('#ED4245')
        .setTimestamp();
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

// ==================== BALANCE COMMAND ====================
const balanceCommand = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check API key balance')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const result = await checkApiKeyBalance();

      if (result.success) {
        const embed = new EmbedBuilder()
          .setTitle('💰 API Balance Information')
          .setColor('#00FF00')
          .addFields(
            { name: '💵 Current Balance', value: `$${result.balance}`, inline: true },
            { name: '📊 Usage This Month', value: `$${result.usage || 'N/A'}`, inline: true },
            { name: '📅 Last Updated', value: new Date().toLocaleString(), inline: false }
          )
          .setTimestamp();

        if (result.balance < 1) {
          embed.setDescription('⚠️ **Warning:** Your balance is running low!');
          embed.setColor('#FFA500');
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply(
          `❌ **Failed to check API balance!**\n**Error:** ${result.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      await interaction.editReply(`❌ **Error checking API balance:**\n${error.message}`);
    }
  },
};

// ==================== SUPPORT COMMAND ====================
const supportCommand = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get support information and links')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Support & Resources')
      .setDescription('Get help with Zeta AutoCatcher and access important resources.')
      .addFields(
        { 
          name: '📋 Support Available For', 
          value: '• Setup and Configuration\n• Token Management Issues\n• Captcha Solver Problems\n• Feature Requests\n• Bug Reports', 
          inline: false 
        },
        { 
          name: '💬 Discord Support Server', 
          value: '[Join Server](https://discord.gg/BgGmu4RgUJ)', 
          inline: true 
        },
        { 
          name: '💳 Buy Captcha Solver Keys', 
          value: '[graceshop by Momento](https://graceshop.mysellauth.com/)', 
          inline: true 
        },
        { 
          name: '📚 Documentation', 
          value: '[Read Docs](https://github.com/momento00/poketwo-autocatcher/blob/main/README.md)', 
          inline: true 
        },
        { 
          name: '🐛 Report Issues', 
          value: '[GitHub Issues](https://github.com/momento00/poketwo-autocatcher/issues)', 
          inline: true 
        }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Zeta AutoCatcher Support' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

// ==================== HELP COMMAND ====================
const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available commands')
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    await showHelpMenu(interaction, 'bot');
  },
};

// ==================== SHARDS COMMAND ====================
const shardsCommand = {
  data: new SlashCommandBuilder()
    .setName('shards')
    .setDescription('Buy shards across all autocatchers')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of shards to buy')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10000))
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const poketwo = "716390085896962058";

    if (autocatchers.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('Shards Purchase')
        .setDescription('No autocatchers are currently active.')
        .setColor('#ED4245')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    await interaction.deferReply();

    const results = [];
    const channelPriority = ['inc', 'incense', 'spawn', 'general', 'random'];

    for (const ac of autocatchers) {
      try {
        // Find a guild with Poketwo
        let targetGuild = null;
        for (const guild of ac.client.guilds.cache.values()) {
          try {
            const member = await guild.members.fetch(poketwo).catch(() => null);
            if (member) {
              targetGuild = guild;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        if (!targetGuild) {
          results.push(`\`✗\` ${ac.client.user.displayName || ac.client.user.globalName} - No server with Poketwo found`);
          continue;
        }

        // Find channel by priority
        let targetChannel = null;
        for (const priority of channelPriority) {
          targetChannel = targetGuild.channels.cache.find(ch => 
            ch.isText() && ch.name.toLowerCase().includes(priority)
          );
          if (targetChannel) break;
        }

        // Fallback to any text channel
        if (!targetChannel) {
          targetChannel = targetGuild.channels.cache.find(ch => ch.isText());
        }

        if (!targetChannel) {
          results.push(`\`✗\` ${ac.client.user.displayName || ac.client.user.globalName} - No suitable channel found`);
          continue;
        }

        // Send buy command
        await targetChannel.send(`<@${poketwo}> buy shards ${amount}`);

        // Wait for response and click confirm
        const filter = m => m.author.id === poketwo && m.content.includes('Are you sure');
        const collected = await targetChannel.awaitMessages({ filter, max: 1, time: 5000 }).catch(() => null);

        if (collected && collected.size > 0) {
          const msg = collected.first();
          await msg.clickButton({ Y: 0, X: 0 });
          results.push(`\`✓\` ${ac.client.user.displayName || ac.client.user.globalName} - Purchased ${amount} shards`);
        } else {
          results.push(`\`⚠\` ${ac.client.user.displayName || ac.client.user.globalName} - Command sent, no confirmation`);
        }

        // Delay between accounts
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push(`\`✗\` ${ac.client.user.displayName || ac.client.user.globalName} - Error: ${error.message.substring(0, 30)}`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('Shards Purchase Complete')
      .setDescription(`Processed **${autocatchers.length}** account(s)`)
      .addFields({ name: 'Results', value: results.join('\n') || 'No results' })
      .setColor('#5865F2')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

// ==================== INCENSE COMMAND ====================
const incenseCommand = {
  data: new SlashCommandBuilder()
    .setName('incense')
    .setDescription('Buy incense across all autocatchers')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Incense duration')
        .setRequired(true)
        .addChoices(
          { name: '1 Day', value: '1d' },
          { name: '3 Hours', value: '3h' },
          { name: '1 Hour', value: '1h' }
        ))
    .addStringOption(option =>
      option.setName('interval')
        .setDescription('Spawn interval')
        .setRequired(true)
        .addChoices(
          { name: '10 Seconds', value: '10s' },
          { name: '20 Seconds', value: '20s' },
          { name: '30 Seconds', value: '30s' }
        ))
    .setContexts(0, 1, 2)
    .setIntegrationTypes(0, 1),
  
  async execute(interaction) {
    const duration = interaction.options.getString('duration');
    const interval = interaction.options.getString('interval');
    const poketwo = "716390085896962058";

    if (autocatchers.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('Incense Purchase')
        .setDescription('No autocatchers are currently active.')
        .setColor('#ED4245')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    await interaction.deferReply();

    const results = [];
    const channelPriority = ['inc', 'incense', 'spawn', 'general', 'random'];

    for (const ac of autocatchers) {
      try {
        // Find a guild with Poketwo
        let targetGuild = null;
        for (const guild of ac.client.guilds.cache.values()) {
          try {
            const member = await guild.members.fetch(poketwo).catch(() => null);
            if (member) {
              targetGuild = guild;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        if (!targetGuild) {
          results.push(`\`✗\` ${ac.client.user.displayName || ac.client.user.globalName} - No server with Poketwo found`);
          continue;
        }

        // Find channel by priority
        let targetChannel = null;
        for (const priority of channelPriority) {
          targetChannel = targetGuild.channels.cache.find(ch => 
            ch.isText() && ch.name.toLowerCase().includes(priority)
          );
          if (targetChannel) break;
        }

        // Fallback to any text channel
        if (!targetChannel) {
          targetChannel = targetGuild.channels.cache.find(ch => ch.isText());
        }

        if (!targetChannel) {
          results.push(`\`✗\` ${ac.client.user.displayName || ac.client.user.globalName} - No suitable channel found`);
          continue;
        }

        // Send buy command
        await targetChannel.send(`<@${poketwo}> incense buy ${duration} ${interval}`);

        // Wait for response and click confirm
        const filter = m => m.author.id === poketwo && m.content.includes('incense will instantly be activated');
        const collected = await targetChannel.awaitMessages({ filter, max: 1, time: 5000 }).catch(() => null);

        if (collected && collected.size > 0) {
          const msg = collected.first();
          await msg.clickButton({ Y: 2, X: 0 });
          results.push(`\`✓\` ${ac.client.user.displayName || ac.client.user.globalName} - Purchased incense (${duration} ${interval})`);
        } else {
          results.push(`\`⚠\` ${ac.client.user.displayName || ac.client.user.globalName} - Command sent, no confirmation`);
        }

        // Delay between accounts
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push(`\`✗\` ${ac.client.user.displayName || ac.client.user.globalName} - Error: ${error.message.substring(0, 30)}`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('Incense Purchase Complete')
      .setDescription(`Processed **${autocatchers.length}** account(s)`)
      .addFields(
        { name: 'Configuration', value: `Duration: ${duration}\nInterval: ${interval}`, inline: true },
        { name: 'Results', value: results.join('\n') || 'No results', inline: false }
      )
      .setColor('#5865F2')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

// ==================== EXPORT ALL COMMANDS ====================
module.exports = [
  pingCommand,
  statsCommand,
  pokemonCommand,
  reloadCommand,
  tokenCommand,
  captchaCommand,
  setprefixCommand,
  ownerCommand,
  viewtokensCommand,
  mpanelCommand,
  solverCommand,
  balanceCommand,
  supportCommand,
  helpCommand,
  shardsCommand,
  incenseCommand
];

module.exports.showHelpMenu = showHelpMenu;
