# Reaction-Bot - Responding to hashtags one gif at a time

Reaction-Bot is built with [BotKit](https://github.com/howdyai/botkit/blob/master/readme.md).

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
## Installation

Reaction-Bot is available on Github at https://github.com/kieckhafer/reaction-bot

```bash
git clone git@github.com:kieckhafer/reaction-bot.git
```

After cloning the Git repository, you have to install the node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.
```bash
npm install
```

Use the `--production` flag to skip the installation of devDependencies.
```bash
npm install --production
```



## Running Reaction-Bot

Reaction-Bot runs in Node.

There are two ways to run Reaction-Bot. The standard way, which requires a restart to incorporate any code changes:

```bash
token=<token> node rbot.js
```

And the enhanced way, which automatically detects changes to rbot.js and restarts Node with every change (requires [nodemon](https://github.com/remy/nodemon)):

```bash
token=<token> nodemon rbot.js
```



## Adding a new call & response

It's easy to create a new call & response - simply replace the KEYWORD and the RESPONSE in the code below.

```javascript

botReply(['#KEYWORD'], [
    'RESPONSE 1'
]);

```

You can also have multiple keywords call the same response.

```javascript

botReply(['#KEYWORD', 'KEYWORD2'], [
    'RESPONSE 1'
]);

```

Want to pull a random response from a list? Cool. You can.

```javascript

botReply(['#KEYWORD'], [
    'RESPONSE 1',
    'RESPONSE 2',
    'RESPONSE 3'
]);

```

Please try and keep rbot.js organized by adding new keywords in alphabetical order.



## Expanded usage

You can do pretty much anything with [BotKit](http://howdy.ai/botkit/). Feel free to expand on it in any way you want.



## What does Reaction-Bot do?

Responds to our various #'s

```bash
#coffee
#stabbed
#struggleplate
etc.
```

Tells you your commute time from Reaction's Santa Monica office

```bash
#drivetime {address}
#walktime {address}
#biketime {address}
#choppertime {address}
```

See all the commands by asking Reaction-Bot for help

```bash
#bothelp or #bothelp-long
```
