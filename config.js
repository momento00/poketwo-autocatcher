module.exports = {
  botToken: "DISCORD_BOT_TOKEN",
  prefix: "!",
  owners: ["OWNER1_ID", "OWNER2_ID"],
  captchaHook: "CAPTCHA_LOGGING_WEBHOOK",
  logHook: "LOGGING_WEBHOOK",
  logs: {
    HighLowIVs: true,
    Quests: true,
    Rare: true,   //legs,myths,ubs,regionals
    Shiny: true },
    
  //Ai Catching (Paid) 
  aiHostname: "HostName", // format: url:port (e.g., "example.com:8080")
  aiLicenseKey: "AI_API_KEY",
  aiCatch: false,
    
  // Captcha key
  // Buy Captcha Solves from https://graceshop.mysellauth.com/
  captchaApiKey: "CAPTCHA_API_KEY",
  
  waitAfterCaptcha: 5000,
  waitAfterSpawn: 1500,
  
  blacklistedServers: ["716390832034414685", "serverid2"] 
};
