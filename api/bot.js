const fetch = require("node-fetch");
const { Telegraf } = require("telegraf");

// Your Telegram bot token from BotFather
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Replace with your GitHub repo details
const owner = "code100x";
const repo = "cms";

// Last seen issue ID
let lastIssueId = 0;

// Function to fetch and send all open issues
async function sendOpenIssues(ctx) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open`
    );
    const issues = await response.json();

    if (issues.length === 0) {
      ctx.reply("There are currently no open issues in the repository.");
      return;
    }

    let message = `🚨 *Open Issues in ${owner}/${repo}* 🚨\n\n`;
    issues.forEach((issue) => {
      message +=
        `*Title:* *${issue.title}*\n` +
        `*Created by:* @${issue.user.login}\n` +
        `*Date:* ${new Date(issue.created_at).toLocaleString()}\n` +
        `📎 [View Issue](${issue.html_url})\n\n`;
    });

    // Ensure message length is within Telegram limits
    if (message.length > 4096) {
      message = message.slice(0, 4000) + "\n\n... (message truncated)";
    }

    ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching issues:", error);
    ctx.reply("Sorry, I couldn't fetch the issues at the moment.");
  }
}

// Command to handle /start
bot.start((ctx) => {
  console.log("Hellloooo");
  ctx.reply(
    "Welcome! I'll keep you updated on new issues. Here are the current open issues:"
  );
  sendOpenIssues(ctx); // Call function to send open issues
});

// Start the bot
bot.launch().then(() => {
  console.log("Bot is up and running!");
});

// Check for new issues every 10 minutes
setInterval(checkForNewIssues, 10 * 60 * 1000);

// Function to check for new issues
async function checkForNewIssues() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`
    );
    const issues = await response.json();

    if (issues.length > 0 && issues[0].id !== lastIssueId) {
      // Update the last seen issue ID
      lastIssueId = issues[0].id;

      // Format message with issue details
      const issue = issues[0];
      const message =
        `🚨 *New Issue Alert in ${owner}/${repo}!* 🚨\n\n` +
        `*Title:* *${issue.title}*\n` +
        `*Created by:* @${issue.user.login}\n` +
        `*Date:* ${new Date(issue.created_at).toLocaleString()}\n\n` +
        `*Description:*\n${
          issue.body
            ? issue.body.slice(0, 200) + "..."
            : "No description provided."
        }\n\n` +
        `📎 [View Issue](${issue.html_url})`;

      // Send message on Telegram
      bot.telegram.sendMessage(ctx.chat.id, message, {
        parse_mode: "Markdown",
      });
    }
  } catch (error) {
    console.error("Error fetching issues:", error);
  }
}

module.exports = async (req, res) => {
    if (req.method === 'POST') {
      bot.handleUpdate(req.body); // Pass incoming updates to Telegraf
      res.status(200).send('OK');
    } else {
      res.status(405).send('Method Not Allowed');
    }
  };