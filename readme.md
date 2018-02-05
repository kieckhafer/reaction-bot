# Reaction-Bot - Responding to hashtags one gif at a time

Reaction-Bot is a SlackBot built with [BotKit](https://github.com/howdyai/botkit/blob/master/readme.md).

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

     ___       __       __          __    __       ___       __   __
    /   \     |  |     |  |        |  |  |  |     /   \     |  | |  |
   /  ^  \    |  |     |  |        |  |__|  |    /  ^  \    |  | |  |
  /  /_\  \   |  |     |  |        |   __   |   /  /_\  \   |  | |  |
 /  _____  \  |  `----.|  `----.   |  |  |  |  /  _____  \  |  | |  `----.
/__/     \__\ |_______||_______|   |__|  |__| /__/     \__\ |__| |_______|

.______       _______     ___       ______ .___________. __    ______   .__   __.
|   _  \     |   ____|   /   \     /      ||           ||  |  /  __  \  |  \ |  |
|  |_)  |    |  |__     /  ^  \   |  ,----'`---|  |----`|  | |  |  |  | |   \|  |
|      /     |   __|   /  /_\  \  |  |         |  |     |  | |  |  |  | |  . `  |
|  |\  \----.|  |____ /  _____  \ |  `----.    |  |     |  | |  `--'  | |  |\   |
| _| `._____||_______/__/     \__\ \______|    |__|     |__|  \______/  |__| \__|

.______     ______   .___________.
|   _  \   /  __  \  |           |
|  |_)  | |  |  |  | `---|  |----`
|   _  <  |  |  |  |     |  |
|  |_)  | |  `--'  |     |  |
|______/   \______/      |__|


~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Prerequisites

A Slack API Key is required to use Reaction-Bot. API Keys are created by registering a new Bot integration at https://{your-team-url}.slack.com/apps/manage/custom-integrations. You may need special permissions within your team to create a new Bot integration.

## Installation

Reaction-Bot is available on Github at https://github.com/kieckhafer/reaction-bot

```
git clone git@github.com:kieckhafer/reaction-bot.git
```

After cloning the Git repository, you need to install the node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.

```
npm install
```

Use the `--production` flag to skip the installation of devDependencies.
```
npm install --production
```



## Running Reaction-Bot

Reaction-Bot runs in Node.

To run a bare-bones version of Reaction-Bot, use the command line to navigate to the folder where Reaction-Bot lives, and type the following command:

```
TOKEN=<slack-api-key> node rbot.js
```

That's it! Now simply invite the bot user into whichever chat rooms you'd like it to be available in.

Reaction-Bot can also be initiated using a variety of node process managers such as [nodemon](https://github.com/remy/nodemon), [forever.js](https://github.com/foreverjs/forever), and [PM2](https://github.com/Unitech/pm2).

## Adding a new call & response

It's easy to create a new call & response - simply replace the KEYWORD and the RESPONSE in the code below.

```
botReply(['#KEYWORD'], [
    'RESPONSE 1'
]);
```

You can also have multiple keywords call the same response.

```
botReply(['#KEYWORD', 'KEYWORD2'], [
    'RESPONSE 1'
]);
```

Want to pull a random response from a list? Cool. You can.

```
botReply(['#KEYWORD'], [
    'RESPONSE 1',
    'RESPONSE 2',
    'RESPONSE 3'
]);
```

## What does Reaction-Bot do?

Responds to our various #'s

```
#coffee
#stabbed
#struggleplate
etc.
```

Tells you your commute time from Reaction's Santa Monica office. Requires a Google Maps API key to be set as an environmental variable on startup.
```
TOKEN=<slack-api-key> MAPS_API=<google-maps-api-key> node rbot.js
```

```
#drivetime {address}
#walktime {address}
#biketime {address}
#choppertime {address}
```

Displays a live image of Earth from the Himawari-8 satellite. Requires a location to save images to, and a URL to view saved images, to be set as environmental variables on startup.
```
TOKEN=<slack-api-key> HIMAWARI_OUTFILE=<path-to-local-image> HIMAWARI_URL=<url-of-image> node rbot.js
```

```
#earthnow
```

Displays current local time of all Reaction team members around the world, or displays any time based off of a time input of Reaction's Santa Monica office (input must be military time).
```
TOKEN=<slack-api-key> HIMAWARI_OUTFILE=<path-to-local-image> HIMAWARI_URL=<url-of-image> node rbot.js
```

```
#timezones
#findatime 2:00
#findatime 17:00
```

See all the commands by asking Reaction-Bot for help

```
#bothelp or #bothelp-long
```

## Expanded usage

You can do pretty much anything with [BotKit](http://howdy.ai/botkit/). Feel free to expand on it in any way you want.
