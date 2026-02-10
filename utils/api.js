const axios = require("axios");
const config = require('../config');
const https = require('https');
const { EmbedBuilder, WebhookClient } = require("discord.js");

// Custom HTTPS agent (ignores SSL issues)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Timeout promise helper
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Helper function to normalize URL format
function normalizeUrl(hostname) {
  if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
    return hostname;
  }
  return `http://${hostname}`;
}

function maskLicenseKey(key) {
  if (!key || key.length < 5) return '***';
  return '***' + key.slice(-4);
}
// ========== AI Prediction API ==========
async function getAIPrediction(imageUrl) {
  try {
    const apiUrl = `${normalizeUrl(config.aiHostname)}/predict`;
    
    const response = await axios.post(
      apiUrl,
      { imageUrl: imageUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-license-key': config.aiLicenseKey,
        },
        timeout: 10000,
      }
    );
    
    console.log('🤖 [AI-API] Prediction successful:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('❌ [AI-API] Error:', error.response.data.error);
    } else if (error.request) {
      console.error('❌ [AI-API] Invalid hostname, No response received from host');
    } else {
      console.error('❌ [AI-API] Request Error:', error.message);
    }
    throw error;
  }
}

async function getName(imageUrl, altName) {
  try {
    // Note: apiBaseUrl and key are not defined - this function may need configuration
    const response = await axios.post(
      apiBaseUrl,
      { url: imageUrl, alt_name: altName },
      { headers: { "X-Authorization": key } }
    );

    if (response.data.error) {
      console.log(response.data.error);
      return [null, 0];
    }

    const { predicted_class: pokemonName, confidence } = response.data;
    return [pokemonName.toLowerCase(), confidence];
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "An error occurred while getting the name. Please contact the admin!"
    );
    return [null, 0];
  }
}

// ========== Captcha Solver API ==========
async function solveCaptcha(token, uid) {
  // First try with primary hostname
  let url = `http://solver.momentohost.in:1080/momento-solve`;
  
  try {
    console.log("🚀 Sending captcha solve request...");
    console.log(` Token: ${token}`);
    console.log(` UID: ${uid}`);
    
    const response = await withTimeout(
      axios.post(url, { token, uid }, {
        headers: { "x-license-key": config.captchaApiKey },
        httpsAgent
      }),
      180000
    );
    
    console.log("📦 Raw Response:", response.data);
    
    if (response.data.status === true) {
      return { success: true, result: response.data.result || "solved" };
    } else {
      // Primary hostname failed, try alternative
      console.log(`Primary hostname failed: ${response.data.error || "Captcha solving failed"}`);
      return await tryAlternativeCaptchaSolver(token, uid, response.data.error || "Captcha solving failed");
    }
  } catch (error) {
    console.error("💥 Captcha solve error on primary hostname:", error.message);
    // Primary hostname failed, try alternative
    const errorMessage = error.response?.data?.error || error.message;
    return await tryAlternativeCaptchaSolver(token, uid, errorMessage);
  }
}

// Alternative captcha solver function
async function tryAlternativeCaptchaSolver(token, uid, primaryError = "Unknown error") {
  // Check if alternative hostname is configured
  if (!"prem-eu2.bot-hosting.net:20786") {
    console.log("No alternative hostname configured");
    // Return the original error since there's no fallback
    return { success: false, error: `Primary captcha solver failed: ${primaryError}` };
  }
  
  const altUrl = `http://prem-eu2.bot-hosting.net:20786/momento-solve`;
  
  try {
    console.log(`Trying alternative captcha solver: prem-eu2.bot-hosting.net:20786`);
    
    const response = await axios.post(altUrl, { token, uid }, {
      headers: { "x-license-key": config.captchaApiKey },
      httpsAgent
    });
    
    console.log("📦 Raw Response from alternative:", response.data);
    
    if (response.data.status === true) {
      return { success: true, result: response.data.result || "solved" };
    } else {
      console.log(`Alternative hostname also failed: ${response.data.error || "Captcha solving failed"}`);
      return {
        success: false,
        error: `Both primary (${primaryError}) and alternative (${response.data.error || "Captcha solving failed"}) captcha solvers failed`,
      };
    }
  } catch (error) {
    console.error("💥 Captcha solve error on alternative hostname:", error.message);
    const altErrorMessage = error.response?.data?.error || error.message;
    return { success: false, error: `Both primary (${primaryError}) and alternative (${altErrorMessage}) captcha solvers failed` };
  }
}

/**
 * Check API key balance / usage
 */
async function checkApiKeyBalance() {
  // First try with primary hostname
  const url = `http://solver.momentohost.in:1080/check-balance`;
  
  try {
    const response = await withTimeout(
      axios.get(url, {
        headers: { "x-license-key": config.captchaApiKey },
        httpsAgent
      }),
      180000
    );
    
    if (response.data.success) {
      return {
        success: true,
        key: response.data.key,
        solvesAllowed: response.data.solvesAllowed,
        solvesUsed: response.data.solvesUsed,
        remaining: response.data.remaining,
        active: response.data.active,
        createdAt: response.data.createdAt,
        note: response.data.note
      };
    } else {
      // Primary hostname failed, try alternative
      console.log(`Balance check failed on primary: ${response.data.error || "Check balance failed"}`);
      return await tryAlternativeBalanceCheck(response.data.error || "Check balance failed");
    }
  } catch (error) {
    console.error('Balance check error on primary:', error.message);
    // Primary hostname failed, try alternative
    const errorMessage = error.response?.data?.error || error.message;
    return await tryAlternativeBalanceCheck(errorMessage);
  }
}

// Alternative balance check function
async function tryAlternativeBalanceCheck(primaryError = "Unknown error") {
  // Check if alternative hostname is configured
  if (!"prem-eu2.bot-hosting.net:20786") {
    console.log("No alternative hostname configured for balance check");
    return { success: false, error: `Primary balance check failed: ${primaryError}` };
  }
  
  const altUrl = `http://prem-eu2.bot-hosting.net:20786/check-balance`;
  
  try {
    const response = await axios.get(altUrl, {
      headers: { "x-license-key": config.captchaApiKey },
      httpsAgent
    });
    
    if (response.data.success) {
      return {
        success: true,
        key: response.data.key,
        solvesAllowed: response.data.solvesAllowed,
        solvesUsed: response.data.solvesUsed,
        remaining: response.data.remaining,
        active: response.data.active,
        createdAt: response.data.createdAt,
        note: response.data.note
      };
    } else {
      console.log(`Alternative balance check also failed: ${response.data.error || "Check balance failed"}`);
      return { success: false, error: `Both primary (${primaryError}) and alternative (${response.data.error || "Check balance failed"}) balance checks failed` };
    }
  } catch (error) {
    console.error('Balance check error on alternative:', error.message);
    const altErrorMessage = error.response?.data?.error || error.message;
    return { success: false, error: `Both primary (${primaryError}) and alternative (${altErrorMessage}) balance checks failed` };
  }
}

// ========== Webhook Notification Function ==========

async function sendCaptchaMessage(
  username,
  userId,
  status,
  method = "Momento's Zeta Solver",
  timeTaken = null,
  balanceInfo = null,
  serverName = "Unknown Server"
) {
  try {
    const hook = new WebhookClient({ url: config.captchaHook });
    let embed;
    
    const timestamp = Math.floor(Date.now() / 1000);

    if (status === "detected") {
      // Fetch balance info for detection message
      if (!balanceInfo) {
        balanceInfo = await checkApiKeyBalance();
      }

      const description = [
        `**License Key:** \`${maskLicenseKey(config.captchaApiKey)}\``,
        `**User ID:** \`${userId}\``,
        `**Name:** ${username}`,
        ``,
        balanceInfo?.success 
          ? `**Remaining:** ${balanceInfo.remaining} / ${balanceInfo.solvesAllowed}`
          : `**Remaining:** Unable to fetch`,
        `**Server:** ${serverName}`,
        ``,
        `**Link:** [Captcha](https://verify.poketwo.net/captcha/${userId})`,
        `**At:** <t:${timestamp}:R>`,
      ].join('\n');

      embed = new EmbedBuilder()
        .setTitle("🔍 CAPTCHA Detected")
        .setDescription(description)
        .setColor("#FFA500")
        .setFooter({ text: method })
        .setTimestamp()
        .setThumbnail("https://cdn.discordapp.com/emojis/852406980529381406.png");

    } else if (status === "solved") {
      // Fetch updated balance info after solving
      if (!balanceInfo) {
        balanceInfo = await checkApiKeyBalance();
      }

      const description = [
        `**License Key:** \`${maskLicenseKey(config.captchaApiKey)}\``,
        `**User ID:** \`${userId}\``,
        `**Name:** ${username}`,
        ``,
        `**Time Taken:** ${timeTaken || "N/A"}`,
        ``,
        balanceInfo?.success 
          ? `**Remaining:** ${balanceInfo.remaining} / ${balanceInfo.solvesAllowed}`
          : `**Remaining:** Unable to fetch`,
        `**Server:** ${serverName}`,
        ``,
        `**At:** <t:${timestamp}:R>`,
      ].join('\n');

      embed = new EmbedBuilder()
        .setTitle("✅ Captcha Solved")
        .setDescription(description)
        .setColor("#00FF00")
        .setFooter({ text: method })
        .setTimestamp()
        .setThumbnail("https://cdn.discordapp.com/emojis/852406980529381406.png");

    } else if (status === "failed") {
      // Fetch balance info for failed message
      if (!balanceInfo) {
        balanceInfo = await checkApiKeyBalance();
      }

      const description = [
        `**License Key:** \`${maskLicenseKey(config.captchaApiKey)}\``,
        `**User ID:** \`${userId}\``,
        `**Name:** ${username}`,
        ``,
        balanceInfo?.success 
          ? `**Remaining:** ${balanceInfo.remaining} / ${balanceInfo.solvesAllowed}`
          : `**Remaining:** Unable to fetch`,
        `**Server:** ${serverName}`,
        ``,
        `**At:** <t:${timestamp}:R>`,
        ``,
        `⚠️ *Manual intervention may be required*`,
      ].join('\n');

      embed = new EmbedBuilder()
        .setTitle("❌ CAPTCHA SOLVING FAILED")
        .setDescription(description)
        .setColor("#FF0000")
        .setFooter({ text: method })
        .setTimestamp()
        .setThumbnail("https://cdn.discordapp.com/emojis/852406980529381406.png");
    }

    await hook.send({
      username: status === "solved" ? "Zeta Bot" : "Zeta Solver",
      avatarURL: "https://media1.tenor.com/m/-7eix5RRFCsAAAAC/pokemon-happy-face.gif",
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error sending captcha message:", error);
  }
}

module.exports = {
  getName,
  getAIPrediction,
  solveCaptcha,
  checkApiKeyBalance,
  sendCaptchaMessage
};
