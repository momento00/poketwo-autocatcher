<meta name="description" content="Zeta v1.3 is an advanced open-source Poketwo autocatcher with AI-powered catching, captcha solving, and comprehensive automation features. Designed for efficiency and ease of use."/>

<meta name="keywords" content="Zeta, Poketwo, Poketwo AutoCatcher, Poketwo Bot, poketwo selfbot, poketwo discord bot, poketwo bot, autocatcher, catch pokemon, poketwo-autocatcher, poketwo auto catcher, poketwo helper bot, poketwo rich, poketwo coins, poketwo shiny, online, how-to-get-rich-in-poketwo, momento, Zeta, Poketwo, latest, working, 2026"/>

<meta name="author" content="momento.de"/>

<meta name="url" content="https://github.com/momento00/poketwo-autocatcher" />

<meta name="og:title" content="Zeta v1.3; Pokétwo Autocatcher"/>

<meta name="google-site-verification" content="open source best" />

<meta name="og:url" content="https://github.com/momento00/poketwo-autocatcher" />

<meta name="og:image" content="https://i.imgur.com/85PNo2N.png" />

<meta name="og:description" content="Advanced open-source Poketwo autocatcher with AI-powered catching, captcha solving, and comprehensive automation features. Designed for efficiency and ease of use. This bot automatically catches Pokemon known as Autocatch on Discord. Several other Features to Easily Get Rich in Poketwo."/>

<!-- Header Top img  -->

<!-- Badges (Top) -->

<p align="center">
  <a href="https://github.com/momento00/poketwo-autocatcher"><img width="200px" src="https://cdn.discordapp.com/attachments/1462107266659516610/1466465747701207080/mainlogo.png?ex=697cd827&is=697b86a7&hm=fdca5850c29d20e18d02892b9cdf87341d5fb0fb9e930d39f5c42e75199db552" alt="Zeta Logo"></a>
  <h1 align="center">Zeta v1.3</h1>
</p>

<p align="center">
Zeta v1.3 - Advanced Pokétwo Autocatcher with AI Integration & Captcha Solving
</p>

<p align="center">
  <a href="https://discord.gg/BgGmu4RgUJ"><img src="https://img.shields.io/discord/1133853334944632832?label=Discord&logo=discord&logoColor=white&style=for-the-badge" alt="Discord"></a>
  <a href="https://github.com/momento00/poketwo-autocatcher/stargazers"><img src="https://img.shields.io/github/stars/momento00/poketwo-autocatcher?style=for-the-badge&logo=github&color=blue" alt="Stars"></a>
  <a href="https://www.nodejs.org/"><img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white" alt="made-with-nodejs"></a>
</p>

<p align="center">
  <b>Enjoying Zeta? Give this project a ⭐ on GitHub to show your support!</b>
</p>

<!-- Title & Subtitle -->
<p align="center">
  <i>The Advanced, Open-Source Autocatcher with AI Integration & Captcha Solving</i>
</p>

<img src="https://cdn.discordapp.com/attachments/1462107266659516610/1466465747701207080/mainlogo.png?ex=697cd827&is=697b86a7&hm=fdca5850c29d20e18d02892b9cdf87341d5fb0fb9e930d39f5c42e75199db552" alt="poketwo logo" align="right" height="120px">

<h2>About</h2>

Zeta v1.3 is an advanced open-source Pokétwo autocatcher featuring AI-powered catching, automated captcha solving, and comprehensive automation features. Fully customizable and designed for efficiency and ease of use. Runnable on multiple accounts simultaneously with advanced tracking and logging capabilities.

<h2 align="left">Support</h2>

If you need any support, please join [our Discord server](https://discord.gg/BgGmu4RgUJ)

<h2 align="left">Features</h2>

* [x] Supports Infinite Accounts </br>
* [x] Hint (Default) + AI-Powered Catching (Paid) </br>
* [x] Automated Captcha Solving </br>
* [x] Can catch EVERY pokemon (All gen + New forms) </br>
* [x] Interactive Commands </br>
* [x] Useful Webhook Logging </br>
* [x] Comprehensive Stats Tracking </br>
* [x] Level Detection & IV Scoring </br>
* [x] Stores & Logs Catches </br>
* [x] Alerts on Low IV, High IV & Shiny, Legendaries, Mythicals, and Ultra Beasts</br>
* [x] Tracks catches and calculates catch rates per hour </br>
* [x] Pauses and alerts on captcha </br>
* [x] Server Blacklisting </br>
* [x] Market Automation </br>
* [x] Quest Completion Tracking </br>

<h2 align="left">Pricing</h2>

Zeta v1.3 is fully open-source and free to use! We only charge for premium services:
* **Captcha Solves**: Available at [GraceShop](https://graceshop.mysellauth.com)
    - Get Free 100 Solves by giving a Star to our Zeta ( Create A ticket in Support Server to claim)
* **AI Catching**: Available by contacting `momento.de` (99.7%+ accuracy including new forms)

<h2 align="left">Configurations</h2>

| Name  | Type | Default Value | Description |
| ------------- | ------------- | ------------- | ------------- |
| ```botToken```  | ```String``` | ```undefined```  | Your Discord bot token from https://discord.com/developers/applications. |
| ```prefix```  | ```String``` | ```!```  | The prefix to use for commands. |
| ```owners```  | ```Array``` | ```[]```  | The user IDs of accounts that can control the bot. |
| ```captchaHook```  | ```String``` | ```undefined```  | Webhook URL for captcha logging. |
| ```logHook```  | ```String``` | ```undefined```  | Webhook URL for general logging. |
| ```logs```  | ```Object``` | ```{HighLowIVs: true, Quests: true, Rare: true, Shiny: true}```  | Configuration for different log types. |
| ```aiCatch```  | ```Boolean``` | ```false```  | Enable/disable AI catching feature. |
| ```aiHostname```  | ```String``` | ```undefined```  | Hostname for AI catching service. |
| ```aiLicenseKey```  | ```String``` | ```undefined```  | License key for AI catching. |
| ```captchaApiKey```  | ```String``` | ```undefined```  | API key for captcha solving service. |
| ```waitAfterCaptcha```  | ```Number``` | ```60000```  | Time to wait after captcha (in ms). |
| ```waitAfterSpawn```  | ```Number``` | ```1500```  | Time to wait after spawn (in ms). |
| ```blacklistedServers```  | ```Array``` | ```["716390832034414685"]```  | Server IDs to exclude from catching. |

<h2 align="left">Commands</h2>

| Name  | Options | Description |
| ------------- | ------------- | ------------- |
| ```help```  | ```none```  | Gives a list of these available commands. |
| ```add-token```  | ```token``` | Adds a new token to the autocatcher. |
| ```remove-token```  | ```token``` | Removes a token from the autocatcher. |
| ```stats```  | ```none``` | Displays comprehensive statistics for all accounts. |
| ```captcha```  | ```start/stop``` | Controls captcha solving for specific accounts. |
| ```catcher```  | ```start/stop``` | Controls catching for specific accounts. |
| ```ai-catch```  | ```start/stop``` | Controls AI catching for specific accounts. |
| ```mpanel```  | ```none``` | Opens the market panel for purchasing Pokémon. |
| ```say```  | ```content``` | Makes the bot repeat content with @p2 mentions replaced. |
| ```bal```  | ```none``` | Checks the Poketwo balance. |
| ```click```  | ```button row``` | Clicks a button on a referenced message. |
| ```mbuy```  | ```market_id``` | Buys a Pokémon from the market. |
| ```incense```  | ```none``` | Buys and activates incense. |

## Installation

- Download [NodeJS](https://nodejs.org/en/download)

- Clone the repository:

```bash
git clone https://github.com/momento00/poketwo-autocatcher.git
```

```bash
cd poketwo-autocatcher
```

```bash
npm install
```

- **Configure your settings in [config.js](./config.js)**:
  - **Discord Bot Token**: Obtain from https://discord.com/developers/applications
    1. Go to Discord Developer Portal
    2. Create a New Application
    3. Navigate to the Bot tab
    4. Click "Reset Token" and copy the token
    5. Under Privileged Gateway Intents, enable these 3 intents:
       - Presence Intent
       - Server Members Intent
       - Message Content Intent
    6. Copy your Discord Bot ID , and place it in "https://discord.com/oauth2/authorize?client_id=DISCORD_BOT_ID&permissions=8&integration_type=0&scope=bot" 
    7. Then use this link to add your Discord Bot in your Private Server(s).
  - **Owners**: Add your Discord User ID to control bot commands
  - **Prefix**: Set your desired command prefix (default is '!')

To start the autocatcher, run the following command:

```javascript
node index.js
```

### Adding Autocatcher Tokens

- **Method 1 (Recommended)**: Use the in-app token manager
  1. Start the bot
  2. Run the `!stats` command
  3. Click the "Add Token" button to add new tokens (Support Mass adding)
  4. Use the "Remove Token" button to remove tokens

- **Method 2**: Edit the `data/tokens.json` file directly

```json
[
  "YOUR_SELFBOT_TOKEN_HERE",
  "ANOTHER_SELFBOT_TOKEN_HERE"
]
```

### Important

* For the best experience, ensure your Discord account has proper permissions in the channels where catching occurs.
* Captcha solving requires a valid API key you can buy from [GraceShop](https://graceshop.mysellauth.com).
* AI catching requires a license key obtained by contacting `momento.de`.
* Make sure to add your Discord User ID to the `owners` array in config.js to control the bot commands.

## Contributing

Pull requests & suggestions are always welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Credits

Developed by momento.de
