/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

     ___       __       __          __    __       ___       __   __
    /   \     |  |     |  |        |  |  |  |     /   \     |  | |  |
   /  ^  \    |  |     |  |        |  |__|  |    /  ^  \    |  | |  |
  /  /_\  \   |  |     |  |        |   __   |   /  /_\  \   |  | |  |
 /  _____  \  |  `----.|  `----.   |  |  |  |  /  _____  \  |  | |  `----.
/__/     \__\ |_______||_______|   |__|  |__| /__/     \__\ |__| |_______|

.______       _______     ___       ______ .___________. __    ______   .__   __.
|   _  \     |   ____|   /   \     /      ||           ||  |  /  __  \  |  \ |  |
|  |_)  |    |  |__     /  ^  \   |  ,----"`---|  |----`|  | |  |  |  | |   \|  |
|      /     |   __|   /  /_\  \  |  |         |  |     |  | |  |  |  | |  . `  |
|  |\  \----.|  |____ /  _____  \ |  `----.    |  |     |  | |  `--"  | |  |\   |
| _| `._____||_______/__/     \__\ \______|    |__|     |__|  \______/  |__| \__|

.______     ______   .___________.
|   _  \   /  __  \  |           |
|  |_)  | |  |  |  | `---|  |----`
|   _  <  |  |  |  |     |  |
|  |_)  | |  `--"  |     |  |
|______/   \______/      |__|


~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */


/**
 * Check for a Slack API Token
 */
if (!process.env.TOKEN) {
  console.log("ERROR: Invalid Slack API Token");
  process.exit(1);
}


/**
 * Load Botkit
 */
import Botkit from "./lib/Botkit.js";

/**
 * Load NPM dependencies
 */
import $ from "jquery";

import himawari from "himawari";
import moment from "moment-timezone";
import os from "os";
import schedule from "node-schedule";
import {XMLHttpRequest} from "xmlhttprequest";


/**
 * Set Reaction-Bot options
 */
const controller = Botkit.slackbot({
  debug: true,
});


/**
 * Start Reaction-Bot
 */
const bot = controller.spawn({
  token: process.env.TOKEN
}).startRTM((err, bot) => {
  if (err) {
    throw new Error(err);
  }

  saveSlackInfo(bot);
});


/**
 * #bothelp, #bothelp-long
 * Respond with all available hashtags
 */
controller.hears(["#bothelp", "#bothelp-long"], "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
  let feed = "";
  const botResponse = bot.botkit.allKeywords;
  let _response = "```";

  if (message.text == "#bothelp-long") {
    feed = "\n";
  }

  for (k in botResponse) {
    _response += `${k}  ${feed}`;
  }

  _response += "```";
  bot.reply(message, _response);
});


/**
 * #drivetime <address/zip/landmark>, #biketime <address/zip/landmark>, #walktime <address/zip/landmark>
 * How long would it take drive, walk, or bike to your destination from the Reaction Commerce Santa Monica office?
 * Response includes real-time traffic data from Google
 * Requires a Google API key to be passed as a session variable during startup
 * MAPS_API=<google-maps-api-key>
 */
controller.hears(["#drivetime (.*)", "#walktime (.*)", "#biketime (.*)"], "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
  const reactionAddress = "2110+Main+St,+Santa+Monica,+CA+90405";
  let _hash = message.text.trimLeft();
  _hash = _hash.slice(0, message.text.indexOf(" "));
  const _regExp = new RegExp(`${_hash} (.*)`, "i");
  const inputAddress = message.text.match(_regExp);
  const destinationAddress = inputAddress[1];
  const encodedDestinationAddress = encodeURIComponent(destinationAddress);
  const modes = {
    "#walktime": "walking",
    "#biketime": "bicycling"
  };
  const attch_text = {
    "#drivetime": ":car: :bus: :truck: :bus: :car:",
    "#walktime": ":walking: :walking::skin-tone-2: :walking::skin-tone-3: :walking::skin-tone-4: :walking::skin-tone-5:",
    "#biketime": ":bicyclist: :bicyclist::skin-tone-2: :bicyclist::skin-tone-3: :bicyclist::skin-tone-4: :bicyclist::skin-tone-5:"
  };
  let _error = false;
  const trafficModel = (_hash == "#drivetime") ? "&traffic_model=best_guess" : "";
  const currentMode = (modes[_hash]) ? `&mode=${modes[_hash]}` : "";
  const apiKey = process.env.MAPS_API;
  const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?departure_time=now${currentMode}${trafficModel}&c&origin=${reactionAddress}&destination=${encodedDestinationAddress}&key=${apiKey}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/${reactionAddress}/${encodedDestinationAddress}`;
  const request = new XMLHttpRequest();

  request.open("GET", apiUrl, true);

  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      const data = JSON.parse(request.responseText);
      driveTime = getDriveTime(data, _hash);
      const xTime = _hash.slice(1);
      const driveTimeOutput = `${xTime} to ${destinationAddress} is ${driveTime}`;

      // To Do - convert time from googles output (5 hours, 21 mins - 1 hour, 1 minute - 20 minutes) to plain old minutes
      const driveTimeMinutes = driveTime;
      // To Do - convert time from googles output (5 hours, 21 mins - 1 hour, 1 minute - 20 minutes) to plain old minutes

      if (driveTimeMinutes <= "30") {
        var driveTimeImages = ["http://i.giphy.com/YlQQYUIEAZ76o.gif", "http://i.giphy.com/IKhGMGrXm0C6Q.gif"];
      } else if (driveTimeMinutes <= "60") {
        var driveTimeImages = ["http://i.giphy.com/l6mxLLvfadIQw.gif"];
      } else {
        var driveTimeImages = ["http://i.giphy.com/mrpNRAKIALT5C.gif"];
      }

      const driveTimeImage = driveTimeImages[Math.floor(Math.random() * driveTimeImages.length)];

      bot.reply(message, `${driveTimeOutput} :car: :bus: :bus: :car: ${driveTimeImage}`);
    } else {
      // We reached our target server, but it returned an error
      _error = true;
    }
  };

  request.onerror = () => {
    _error = true;
  };

  if (_error) {
    bot.reply(message, `${xTime} to ${destinationAddress} is currently unknown due to an API error. Hopefully you can see it on Google Maps: ${googleMapsUrl}`);
  }

  request.send();
});

function getDriveTime({routes}, _hash) {
  let drivetime;
  const trafficText = (_hash == "#drivetime") ? ". Traffic is not included in this route." : "";
  if (routes[0]) {
    if (_hash == "#drivetime" && routes[0].legs[0].duration_in_traffic) {
      driveTime = routes[0].legs[0].duration_in_traffic.text;
    } else {
      if (routes[0].legs[0].duration) {
        driveTime = routes[0].legs[0].duration.text + trafficText;
      } else {
        driveTime = "not available. Please try another query.";
      }
    }
  } else {
    driveTime = "not available. Please try another more specific query - or a location that\"s not overseas.";
  }

  return driveTime;
}


/**
 * #choppertime <address/zip/landmark>
 * How long would it take to Chopper to your destination from the Reaction Commerce Santa Monica office?
 * Inspired by Kobe Bryant, LA Chopper King
 * Requires a Google API key to be passed as a session variable during startup
 * MAPS_API=<google-maps-api-key>
 */
controller.hears(["#choppertime (.*)"], "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
  // calculation is done in lattitue / longitude
  reactionCoords = {};
  destCoords = {};
  reactionCoords.lat = "34.006008";
  reactionCoords.lng = "-118.4886012";
  const inputAddress = message.text.match(/#choppertime (.*)/i);
  const destinationAddress = inputAddress[1];
  const encodedDestinationAddress = encodeURIComponent(destinationAddress);
  const apiKey = process.env.MAPS_API;
  // get destination coords
  const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedDestinationAddress}&key=${apiKey}`;
  const request = new XMLHttpRequest();
  request.open("GET", apiUrl, true);

  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      const data = JSON.parse(request.responseText);
      if (data.results[0]) {
        if (data.results[0].geometry.location) {
          destCoords.lat = data.results[0].geometry.location.lat;
          destCoords.lng = data.results[0].geometry.location.lng;

          distanceAsTheKobeFlies = getDistance(reactionCoords, destCoords);

          // average chopper speed is 240km/h, slow LA choppers migh tbe 200km or so
          // source http://phys.org/news/2011-05-eurocopter-x3-world-fastest-copter.html
          chopperTimeRaw = distanceAsTheKobeFlies / 200;

          // add takeoff, up-to-speed, and landing time.. about 8 min = .12 hr
          chopperTimeRaw = chopperTimeRaw + .12;

          // get a pretty time
          chopperTimeReadable = getHHMM(chopperTimeRaw);

          var chopperTimeOutput = `It would take ${chopperTimeReadable} for Kode Brian to travel to ${destinationAddress}`;
        } else {
          const chopperTimeOuput = "There was some unknown issue finding the coordinates of your desto.";
        }
      } else {
        var chopperTimeOutput = "No results. Please try another, more specific query.";
      }
      bot.reply(message, `:helicopter: :kobe: ${chopperTimeOutput} :kobe: :helicopter:`);
    } else {
      // We reached our target server, but it returned an error
      bot.reply(message, `Choppertime to ${destinationAddress} is currently unknown due to an API error.`);
    }
  };

  request.onerror = () => {
    bot.reply(message, `Choppertime to ${destinationAddress} is currently unknown due to an API error.`);
  };
  request.send();
});


/**
 * #earthnow
 * Download real-time images of Earth from the Himawari-8 satellite
 * Requires two extra parameters to be passed as session variables during startup
 * HIMAWARI_OUTFILE=<path-to-local-image>
 * HIMAWARI_URL=<url-of-image> node rbot.js
 */
controller.hears(["#earthnow"], "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
  bot.reply(message, "generating image from Himawari-8 satellite...");
  const outfilePath = process.env.HIMAWARI_OUTFILE;
  const himawariImageUrl = process.env.HIMAWARI_URL;
  himawari({
    zoom: 1,
    date: "latest", // Or new Date() or a date string
    debug: false,
    infrared: false,
    outfile: outfilePath,
    parallel: false,
    skipEmpty: true,
    timeout: 30000,
    urls: false,
    success() {
      // added ms to prevent Slack from caching images. Not like the planet"s view is gonna change much :P
      bot.reply(message, `${himawariImageUrl}?ms=${(new Date()).getMilliseconds()}`);
      // process.exit();
    },
    error(err) {
      console.log(err);
      bot.reply("Satelite Server is probably down.");
    },
    chunk({outfile, part, total}) {
      console.log(`${outfile}: ${part}/${total}`);
    }
  });
});


/**
 * #timezones
 * Display current time for all Reaction team members across the world
 * Los Angeles, Colorado Springs, Connecticut, Lagos, Nairobi, Manila
 */
controller.hears(["#timezones", "#currentTime"], "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
  const baseTime = moment().tz("America/Los_Angeles");

  const americaPacific = `${baseTime.clone().tz("America/Los_Angeles").format("hh:mm A")}:  :flag-us-ca:  Santa Monica / California`;
  const americaMountain = `${baseTime.clone().tz("America/Denver").format("hh:mm A")}:  :flag-us-az:  Arizona / :flag-us-co:  Colorado / :flag-us-ut:  Utah`;
  const americaCentral = `${baseTime.clone().tz("America/Chicago").format("hh:mm A")}:  :flag-us-la:  Louisiana / :flag-us-wi:  Wisconsin`;
  const americaEastern = `${baseTime.clone().tz("America/New_York").format("hh:mm A")}:  :flag-us-ma:  Massachusetts / :flag-us-ny:  New York / :flag-us-oh:  Ohio`;
  const lagos = `${baseTime.clone().tz("Africa/Lagos").format("hh:mm A")}:  :flag-de:  Berlin / :flag-ng:  Lagos`;
  const lucknow = `${baseTime.clone().tz("Asia/Kolkata").format("hh:mm A")}:  :flag-in:  Lucknow`;
  const bangkok = `${baseTime.clone().tz("Asia/Bangkok").format("hh:mm A")}:  :flag-th:  Bangkok`;
  const manila = `${baseTime.clone().tz("Asia/Manila").format("hh:mm A")}:  :flag-ph:  Manila`;

  bot.reply(message, "Reaction Team Time Zones");
  bot.reply(message, americaPacific);
  bot.reply(message, americaMountain);
  bot.reply(message, americaCentral);
  bot.reply(message, americaEastern);
  bot.reply(message, lagos);
  bot.reply(message, lucknow);
  bot.reply(message, bangkok);
  bot.reply(message, manila);
});


/**
 * #findatime
 * Display timezones based on an inputted time
 */
controller.hears(["#findatime (.*)"], "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
  moment.tz.setDefault("America/Los_Angeles");
  const inputTime = message.text.match(/#findatime (.*)/i);
  let time = inputTime[1];

  const colonCheck = time.search(":");

  if (colonCheck === -1) {
    time = `${time.substring(0, time.length - 2)}:${time.substring(time.length - 2)}`
  }

  if (time.length === 4) {
    time = `0${time}`;
  }

  const baseTime = moment(`2018-01-01 ${time}`);

  const americaPacific = `${baseTime.clone().tz("America/Los_Angeles").format("hh:mm A")}:  :flag-us-ca:  Santa Monica / California`;
  const americaMountain = `${baseTime.clone().tz("America/Denver").format("hh:mm A")}:  :flag-us-az:  Arizona / :flag-us-co:  Colorado / :flag-us-ut:  Utah`;
  const americaCentral = `${baseTime.clone().tz("America/Chicago").format("hh:mm A")}:  :flag-us-la:  Louisiana / :flag-us-wi:  Wisconsin`;
  const americaEastern = `${baseTime.clone().tz("America/New_York").format("hh:mm A")}:  :flag-us-ma:  Massachusetts / :flag-us-ny:  New York / :flag-us-oh:  Ohio`;
  const lagos = `${baseTime.clone().tz("Africa/Lagos").format("hh:mm A")}:  :flag-de:  Berlin / :flag-ng:  Lagos`;
  const lucknow = `${baseTime.clone().tz("Asia/Kolkata").format("hh:mm A")}:  :flag-in:  Lucknow`;
  const bangkok = `${baseTime.clone().tz("Asia/Bangkok").format("hh:mm A")}:  :flag-th:  Bangkok`;
  const manila = `${baseTime.clone().tz("Asia/Manila").format("hh:mm A")}:  :flag-ph:  Manila`;

  bot.reply(message, `Reaction Team times when it's ${time} in Santa Monica`);
  bot.reply(message, americaPacific);
  bot.reply(message, americaMountain);
  bot.reply(message, americaCentral);
  bot.reply(message, americaEastern);
  bot.reply(message, lagos);
  bot.reply(message, lucknow);
  bot.reply(message, bangkok);
  bot.reply(message, manila);
});


/**
 * #stargazers
 * Retrieve number of stargazers for the Reaction Commerce Github repository
 */
controller.hears(["#stargazers"], "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
  const apiUrl = "https://api.github.com/repos/reactioncommerce/reaction";
  const request = new XMLHttpRequest();
  request.open("GET", apiUrl, true);

  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      const data = JSON.parse(request.responseText);
      if (data) {
        if (data.stargazers_count) {
          var starGazersOutput = data.stargazers_count;
        } else {
          const starGazersOuput = "Cannot fetch stargazers";
        }
      } else {
        var starGazersOutput = "Cannot fetch stargazers";
      }
      bot.reply(message, `:star: :star: :star2: ${starGazersOutput} :star2: :star: :star:`);
    } else {
      // We reached our target server, but it returned an error
      bot.reply(message, "Cannot fetch stargazers");
    }
  };

  request.onerror = () => {
    bot.reply(message, "Cannot fetch stargazers");
  };
  request.send();
});


/**
 * Ingests a hashtag, spits out a response
 * Use #bothelp (or #bothelp-long) to see all available hashtags
 * @function
 * @param {object} hashtags - Hashtags ingested from Slack input
 * @param {object} responses - Responses sent back to Slack
 */
function botReply(hashtags, responses) {
  controller.hears(hashtags, "direct_message,direct_mention,mention,message_received,ambient", (bot, message) => {
    const botResponse = responses[Math.floor(Math.random() * responses.length)];
    bot.reply(message, botResponse);
  });
}

/**
 * Example
 */

/*

botReply(["#foo", "#bar"], [
    "baz",
    "fatigued"
]);

*/

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


:::::::::  ::::::::::     :::     :::::::::      ::::::::::: :::    ::: ::::::::::: ::::::::
:+:    :+: :+:          :+: :+:   :+:    :+:         :+:     :+:    :+:     :+:    :+:    :+:
+:+    +:+ +:+         +:+   +:+  +:+    +:+         +:+     +:+    +:+     +:+    +:+
+#++:++#:  +#++:++#   +#++:++#++: +#+    +:+         +#+     +#++:++#++     +#+    +#++:++#++
+#+    +#+ +#+        +#+     +#+ +#+    +#+         +#+     +#+    +#+     +#+           +#+
#+#    #+# #+#        #+#     #+# #+#    #+#         #+#     #+#    #+#     #+#    #+#    #+#
###    ### ########## ###     ### #########          ###     ###    ### ########### ########


Hey!... Keep this list alphabetized!!!
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

botReply(["#afterlunch"], [
    "http://new.tinygrab.com/219da34c650c638ab5b863b2fc1b53261c3e9af36d.png"
]);

botReply(["#bagelhead"], [
    "http://media.galaxant.com/000/157/683/desktop-1428330798.jpg"
]);

botReply(["#baptized"], [
    "http://ara-vision.com/gif-library/fail/baptized.gif"
]);

botReply(["#buddy"], [
    "https://m.popkey.co/f9149b/rbVxM.gif"
]);

botReply(["#buzzword"], [
	"Mobilegeddon",
	"Low-hanging fruit",
	"Small wins",
	"Deep Learning",
	"Auto-Scaling",
	"Agile Hybrid",
	"Inclusive",
	"YotaBytes",
	"Dark Data",
	"Phablet",
	"High Availability",
	"Early-stage",
	"Distributive",
	"Bleeding Edge",
	"Fuck you money",
	"Code Ninja",
	"Crushing it",
	"MBA",
	"Vanity Metrics",
	"10x Engineer",
	"World Class WordPress",
	"Cutting Edge",
	"Best-in-class",
	"The Cloud",
	"boil the ocean",
	"glamour metrics",
	"gamification",
	"bricks and clicks",
	"dot-bomb",
	"Ready. Fire. Aim.",
	"value-add",
	"what’s the ask?",
	"unicorn",
	"ROI",
	"bring to the table",
	"cross-pollinate",
	"knee deep",
	"Clickthrough",
	"Close the loop",
	"IOT",
	"Incubators",
	"Startup Accelerator",
	"Seed Round",
	"Evangelist",
	"Wheelhouse",
	"Biowearables",
	"Blockchain",
	"Circle Back",
	"Seamless",
	"Robust and Scalable",
	"ReactJS / React Native",
	"AI",
	"Quantum Computing",
	"High Availability",
	"Acquihire",
	"Pivot",
	"Curated",
	"ISBAT",
	"Cashflow-positive",
	"Bleeding Edge",
	"Churn Rate",
	"Exit Strategy",
	"Minimum Viable Product (MVP)",
	"IxD\"r",
	"Vertical Slice",
  "Serverless"
]);

botReply(["#casinonight"], [
    "http://media1.giphy.com/media/Ef7aMJT141V7i/giphy.gif"
]);

botReply(["#coffee", "#whoops"], [
    "http://i.giphy.com/tId80dcdksC8U.gif"
]);

botReply(["#covfefe"], [
    "https://pbs.twimg.com/media/DBIvO0LU0AEd5s3.jpg",
    "http://i.ato.la/skitch/Donald_Trump___the_‘Covfefe’_Tweet__What_Did_He_Mean____Heavy_com_1EDEA59B.png",
    "http://i.ato.la/skitch/Donald_Trump___the_‘Covfefe’_Tweet__What_Did_He_Mean____Heavy_com_1EDEA66C.png",
    "https://pbs.twimg.com/media/DBINzIBVYAAM9a4.jpg",
    "https://twitter.com/cool_as_heck/status/869797000438362112"
]);

botReply(["#fatigued", "#fatigado"], [
    "http://new.tinygrab.com/219da34c65fb5ffb028e32a00d430b318c38a5ca70.jpg",
    "http://gph.is/1gVrqmL",
    "http://p.fod4.com/p/media/8e626ba361/wjN8hJWWSnqXwVYvp4ZH_Kid%20Table%20Slide.gif"
]);

botReply(["#fridaylunch"], [
    "Eataly- Century City",
    "Big Boi- Sawtelle",
    "Killer Noodle- Sawtelle",
    "Flaming Pot- Sawtelle",
    "Tasty Noodle House- Sawtelle",
    "Meizhou Dongpo- Century City",
    "Souplantation- Brentwood",
    "Maple Block BBQ- Culver City"
]);

botReply(["#grim"], [
    "http://i.imgur.com/cIwwfJ9.gif"
]);

botReply(["#hacked"], [
    "http://i.imgur.com/ye5udHZ.gif"
]);

botReply(["#lol"], [
    "https://s-media-cache-ak0.pinimg.com/originals/80/39/29/803929ecb9179dd8ac2864079d9224a6.jpg",
    "https://media.giphy.com/media/jQmVFypWInKCc/giphy.gif",
    "https://giphy.com/gifs/new-O5NyCibf93upy",
    "http://gph.is/1cYzUmd",
    "http://gph.is/1KWzB0G",
    "http://http://static.comicvine.com/uploads/original/6/69852/4035043-783811_o.gif",
    "http://i.imgur.com/KSCJiW8.gif",
    "http://gph.is/19gSXXm",
    "http://gph.is/1mt6nnw",
    "http://gph.is/1SBDnOP",
    "http://gph.is/1hJ4ovZ",
    "http://i.imgur.com/kbtV8zN.gif"
]);

botReply(["#lunch"], [
  "Aussie Pie Company",
  "Bareburger",
  "Bibibop",
  "Bruno's Italian",
  "Casa Martin",
  "Cava",
  "Cha Cha Chicken ",
  "Chipotle",
  "Hiho",
  "Jinya",
  "Komodo",
  "Mitsuwa",
  "Novel Cafe",
  "Pie Hole",
  "Phorage",
  "Samosa House",
  "Santa Monica Farms",
  "Santa Monica Place food court",
  "Shoops",
  "Simpang ",
  "Stella Barra",
  "Sunny Blue",
  "Taco Libre",
  "Tacos Por Favor",
  "Tender Greens",
  "Thai Vegan",
  "Buffalo Wild Wings",
  "Poking Poke",
  "Wurstkuche",
  "STRFSH",
  "No food. Go Boxing. :boxing:"
]);

botReply(["#mediocre"], [
    "http://i2.kym-cdn.com/photos/images/original/001/025/902/7d5.gif"
]);

botReply(["#mindblown"], [
    "http://ara-vision.com/gif-library/mind-blown/kramer-mind-blown.gif",
    "http://ara-vision.com/gif-library/mind-blown/magic.gif",
    "http://ara-vision.com/gif-library/mind-blown/mind-blown-2.gif",
    "http://ara-vision.com/gif-library/seinfeld/kramer-shocked-2.gif",
    "http://ara-vision.com/gif-library/mind-blown/mind-blown.gif"
]);

botReply(["#obamajam"], [
    ":car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car:"
]);

botReply(["#pandemonium"], [
    "http://pop.h-cdn.co/assets/15/21/1431967859-madmax-guitar.gif",
    "http://i.imgur.com/6WFjtDB.gif%20alt="
]);

botReply(["#richlunch", "#dadispaying"], [
  "Chez Jay",
  "Lawry's Prime Rib",
  "Sugarfish",
  "Chinois",
  "The Curious Palate"
]);

botReply(["#ripian"], [
    "http://drop.itsmeara.com/1cW4x/5EABuhjM",
    "http://d.pr/i/1eBnz"
]);

botReply(["#ripvinson"], [
    "https://www.youtube.com/watch?v=o4T_miEDCMQ&feature=youtu.be"
]);

botReply(["#ripjon"], [
    "http://drop.itsmeara.com/ASFt/3yUgMJH8",
    "https://www.youtube.com/watch?v=0hoJ60Vxaf0&feature=youtu.be"
]);

botReply(["#sadtrombone", "#wompwomp"], [
    "https://wompwompwomp.com/"
]);

botReply(["#shotsfired"], [
    "http://ara-vision.com/gif-library/favorites/shots-fired-compilation.gif",
    "https://localtvwnep.files.wordpress.com/2012/12/shots_fired.jpg"
]);

botReply(["#stabbed"], [
    "http://i.imgur.com/ey5hIyJ.gif"
]);

botReply(["#struggleplate"], [
    "http://2.bp.blogspot.com/-4aTCryIaPY8/TdXkuS41InI/AAAAAAAAGdQ/iKcrrTKoC2o/s1600/DSC06503_2.JPG",
    "http://i.imgur.com/tdUNOYj.jpg",
    "http://i.imgur.com/RnvbRg3.jpg",
    "http://i.imgur.com/5RbGmJb.jpg",
    "http://i.imgur.com/cshWr5P.jpg",
    "http://i.imgur.com/SVjJiO1.jpg",
    "http://i.imgur.com/rGh7S0p.jpg",
    "http://i.imgur.com/bRglqp4.jpg",
    "http://i.imgur.com/wAEH2nA.jpg",
    "http://i.imgur.com/sW7QxJx.jpg",
    "http://38.media.tumblr.com/d04494b57e344367e55bbc2fd357f6fa/tumblr_n9b5pyRSQm1rwt6qvo3_400.jpg",
    "http://i.ato.la/skitch/cilantrofish_1E5039C0.jpg"
]);

botReply(["#strugglelunch"], [
  "A one hundred year egg, no rice",
  "A warm Budweiser off of Sophie's desk",
  "One sip of La Croix",
  "Three peanut butter cups"
]);

botReply(["#strugglemvp", "#cilantrofish"], [
    "http://i.ato.la/skitch/cilantrofish_1E5039C0.jpg"
]);

botReply(["#surf"], [
    "https://media.giphy.com/media/3o7bu5rYASwyVcTo0U/giphy.gif",
    "https://media.giphy.com/media/3o7budz7Alxzyla6EU/giphy.gif",
    "https://media.giphy.com/media/l0IynTJPbOWbSRxHW/giphy.gif"

]);

botReply(["#stillalive"], [
    "I'm alive! Thanks Slackbot!"
]);


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Helper functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/**
 * Distance calculation for #choppertime
 * http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
 */
function getDistance({lat, lng}, {lat, lng}) {

  const rad = x => x * Math.PI / 180;

  const R = 6378137; // Earth’s mean radius in meters

  const dLat = rad(lat - lat);
  const dLong = rad(lng - lng);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat)) * Math.cos(rad(lat)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c / 1000;

  return d; // returns the distance in kilometers
}


/**
 * Time formatting helper for #choppertime
 */
function getHHMM(decimalHours) {
  let output = "";
  const hours = Math.floor(decimalHours);
  const minutes = (Math.floor(decimalHours * 60)) - (hours * 60);

  if (hours == 1) {
    output += "1 hour, ";
  } else if (hours > 1) {
    output += `${hours} hours, `;
  }
  output += `${minutes} minutes`;
  return output;
}


/**
 * Get full team and channel list
 */
const fullTeamList = [];
const fullChannelList = [];

function saveSlackInfo({api}) {
  // Save Slack Users
  // @ https://api.slack.com/methods/users.list
  api.users.list({}, (err, response) => {
    if (response.hasOwnProperty("members") && response.ok) {
      const total = response.members.length;
      for (let i = 0; i < total; i++) {
        const member = response.members[i];
        fullTeamList.push({
          name: member.name,
          id: member.id
        });
      }
    }
  });

  // Save Slack Channels
  // @ https://api.slack.com/methods/channels.list
  api.channels.list({}, (err, response) => {
    if (response.hasOwnProperty("channels") && response.ok) {
      const total = response.channels.length;
      for (let i = 0; i < total; i++) {
        const channel = response.channels[i];
        fullChannelList.push({
          name: channel.name,
          id: channel.id
        });
      }
    }
  });
}


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Keep Reaction-Bot healthy
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/**
 * Keep Reaction-Bot active by silently sending a message once per day
 */
const rule = new schedule.RecurrenceRule();

rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = 9;
rule.minute = 0;

const schedJob = schedule.scheduleJob(rule, () => {
  bot.say({
    text: "I need to be awake!",
    channel: "ABCDEFGHI"
  });
});
