/*
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

# Reaction Bot is a custom slack bot built for (mt)'s UX Team.

# Run the bot from the command line:

    TOKEN=<slack-api-token> node r-bot.js (for manual restarts/updates)
    OR
    TOKEN=<slack-api-token> nodemon r-bot.js (for automatic restarts/updates)

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


// libraries
var himawari = require('himawari');
var schedule = require('node-schedule');
var moment = require('moment-timezone');
var fullTeamList = [];
var fullChannelList = [];


/* Start UX-Bot
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
if (!process.env.TOKEN) {
    console.log('Error: Please specify token');
    process.exit(1);
}

//Include your libraries
var Botkit = require('./lib/Botkit.js');
var os = require('os');
// Allow jQuery
var $ = require('jquery');
// Allow XMLHttpRequest
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

//Show Debugging info in CLI?
var controller = Botkit.slackbot({
    debug: true,
});

//Start your bot
var bot = controller.spawn({
    token: process.env.TOKEN
}).startRTM(function (err, bot) {

    if (err) {
        throw new Error(err);
    }

    saveSlackInfo(bot);

});

// Keep bot talking at least once a day
var rule = new schedule.RecurrenceRule();

// Everyday at 9am make robot do something (silently)
rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = 9;
rule.minute = 0;

var schedJob = schedule.scheduleJob(rule, function () {
    bot.say({
        text: 'I need to be awake!',
        channel: 'C1FSDCL1K'
    });
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */


/* The Good Stuff
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */


/* Show all possible inputs
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
controller.hears(['#bothelp', '#bothelp-long'], 'direct_message,direct_mention,mention,message_received,ambient', function (bot, message) {
    var feed = '';
    var botResponse = bot.botkit.allKeywords;
    var _response = '```';

    if (message.text == '#bothelp-long') {
        feed = '\n';
    }

    for (k in botResponse) {
        _response += k + '  ' + feed;
    }

    _response += '```';
    bot.reply(message, _response);
});


/* #drivetime, #walktime, #biketime, #choppertime
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
/*
 * Google API for
 * drivetime,  walktime, biketime
 * These are all similar, so reusing the same function
 */


// #drivetime, #walktime, #biketime
controller.hears(['#drivetime (.*)', '#walktime (.*)', '#biketime (.*)'], 'direct_message,direct_mention,mention,message_received,ambient', function (bot, message) {
    var reactionAddress = '2110+Main+St,+Santa+Monica,+CA+90405';
    var _hash = message.text.trimLeft();
    _hash = _hash.slice(0, message.text.indexOf(' '));
    var _regExp = new RegExp(_hash + ' (.*)', 'i');
    var inputAddress = message.text.match(_regExp);
    var destinationAddress = inputAddress[1];
    var encodedDestinationAddress = encodeURIComponent(destinationAddress);
    var modes = {
        '#walktime': 'walking',
        '#biketime': 'bicycling'
    };
    var attch_text = {
        '#drivetime': ':car: :bus: :truck: :bus: :car:',
        '#walktime': ':walking: :walking::skin-tone-2: :walking::skin-tone-3: :walking::skin-tone-4: :walking::skin-tone-5:',
        '#biketime': ':bicyclist: :bicyclist::skin-tone-2: :bicyclist::skin-tone-3: :bicyclist::skin-tone-4: :bicyclist::skin-tone-5:'
    };
    var _error = false;
    var trafficModel = (_hash == '#drivetime') ? '&traffic_model=best_guess' : '';
    var currentMode = (modes[_hash]) ? '&mode=' + modes[_hash] : '';
    var apiUrl = 'https://maps.googleapis.com/maps/api/directions/json?departure_time=now' + currentMode + trafficModel + '&c&origin=' + reactionAddress + '&destination=' + encodedDestinationAddress + '&key=AIzaSyBjVGPCTLOZvRJfecKKu69n7_WGajNJVTY';
    var googleMapsUrl = 'https://www.google.com/maps/dir/' + reactionAddress + '/' + encodedDestinationAddress;
    var request = new XMLHttpRequest();

    request.open('GET', apiUrl, true);

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            // Success!
            var data = JSON.parse(request.responseText);
            driveTime = getDriveTime(data, _hash);
            var xTime = _hash.slice(1);
            var driveTimeOutput = xTime + ' to ' + destinationAddress + ' is ' + driveTime;

            // To Do - convert time from googles output (5 hours, 21 mins - 1 hour, 1 minute - 20 minutes) to plain old minutes
            var driveTimeMinutes = driveTime;
            // To Do - convert time from googles output (5 hours, 21 mins - 1 hour, 1 minute - 20 minutes) to plain old minutes

            if (driveTimeMinutes <= '30') {
                var driveTimeImages = ['http://i.giphy.com/YlQQYUIEAZ76o.gif', 'http://i.giphy.com/IKhGMGrXm0C6Q.gif'];
            } else if (driveTimeMinutes <= '60') {
                var driveTimeImages = ['http://i.giphy.com/l6mxLLvfadIQw.gif'];
            } else {
                var driveTimeImages = ['http://i.giphy.com/mrpNRAKIALT5C.gif'];
            }

            var driveTimeImage = driveTimeImages[Math.floor(Math.random() * driveTimeImages.length)];

            bot.reply(message, '' + driveTimeOutput + ' :car: :bus: :bus: :car: ' + driveTimeImage + '');
        } else {
            // We reached our target server, but it returned an error
            _error = true;
        }
    };

    request.onerror = function () {
        _error = true;
    };

    if (_error) {
        bot.reply(message, xTime + ' to ' + destinationAddress + ' is currently unknown due to an API error. Hopefully you can see it on Google Maps: ' + googleMapsUrl);
    }

    request.send();
});

function getDriveTime(data, _hash) {
    var drivetime;
    var trafficText = (_hash == '#drivetime') ? '. Traffic is not included in this route.' : '';
    if (data.routes[0]) {
        if (_hash == '#drivetime' && data.routes[0].legs[0].duration_in_traffic) {
            driveTime = data.routes[0].legs[0].duration_in_traffic.text;
        } else {
            if (data.routes[0].legs[0].duration) {
                driveTime = data.routes[0].legs[0].duration.text + trafficText;
            } else {
                driveTime = 'not available. Please try another query.';
            }
        }
    } else {
        driveTime = 'not available. Please try another more specific query - or a location that\'s not overseas.';
    }

    return driveTime;
}


// #choppertime
controller.hears(['#choppertime (.*)'], 'direct_message,direct_mention,mention,message_received,ambient', function (bot, message) {
    // calculation is done in lattitue / longitude
    mtCoords = {};
    destCoords = {};
    mtCoords.lat = "34.0266594";
    mtCoords.lng = "-118.3794368";
    var inputAddress = message.text.match(/#choppertime (.*)/i);
    var destinationAddress = inputAddress[1];
    var encodedDestinationAddress = encodeURIComponent(destinationAddress);
    // get destination coords
    var apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodedDestinationAddress + '&key=AIzaSyBjVGPCTLOZvRJfecKKu69n7_WGajNJVTY';
    var request = new XMLHttpRequest();
    request.open('GET', apiUrl, true);

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            // Success!
            var data = JSON.parse(request.responseText);
            if (data.results[0]) {
                if (data.results[0].geometry.location) {
                    destCoords.lat = data.results[0].geometry.location.lat;
                    destCoords.lng = data.results[0].geometry.location.lng;

                    distanceAsTheKobeFlies = getDistance(mtCoords, destCoords);

                    // average chopper speed is 240km/h, slow LA choppers migh tbe 200km or so
                    // source http://phys.org/news/2011-05-eurocopter-x3-world-fastest-copter.html
                    chopperTimeRaw = distanceAsTheKobeFlies / 200;

                    // add takeoff, up-to-speed, and landing time.. about 8 min = .12 hr
                    chopperTimeRaw = chopperTimeRaw + .12;

                    // get a pretty time
                    chopperTimeReadable = getHHMM(chopperTimeRaw);

                    var chopperTimeOutput = 'It would take ' + chopperTimeReadable + ' for Kode Brian to travel to ' + destinationAddress;
                } else {
                    var chopperTimeOuput = "There was some unknown issue finding the coordinates of your desto.";
                }
            } else {
                var chopperTimeOutput = 'No results. Please try another, more specific query.';
            }
            bot.reply(message, ':helicopter: :kobe: ' + chopperTimeOutput + ' :kobe: :helicopter:');
        } else {
            // We reached our target server, but it returned an error
            bot.reply(message, 'Choppertime to ' + destinationAddress + ' is currently unknown due to an API error.');
        }
    };

    request.onerror = function () {
        bot.reply(message, 'Choppertime to ' + destinationAddress + ' is currently unknown due to an API error.');
    };
    request.send();
});


/* Download real-time images of Earth from the Himawari-8 satellite
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
controller.hears(['#earthnow'], 'direct_message,direct_mention,mention,message_received,ambient', function (bot, message) {
    bot.reply(message, 'generating image from Himawari-8 satellite...');
    himawari({
        zoom: 1,
        date: 'latest', // Or new Date() or a date string
        debug: false,
        infrared: false,
        outfile: '/usr/share/nginx/html/mt/earth.jpg',
        parallel: false,
        skipEmpty: true,
        timeout: 30000,
        urls: false,
        success: function () {
            // added ms to prevent Slack from caching images. Not like the planet's view is gonna change much :P
            bot.reply(message, 'http://178.62.225.227/mt/earth.jpg?ms=' + (new Date()).getMilliseconds());
            // process.exit();
        },
        error: function (err) {
            console.log(err);
            bot.reply('Satelite Server is probably down.');
        },
        chunk: function (info) {
            console.log(info.outfile + ': ' + info.part + '/' + info.total);
        }
    });
});


/* Get timezones for all Reaction team members
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
controller.hears(['#timezones'], 'direct_message,direct_mention,mention,message_received,ambient', function (bot, message) {
    var losAngeles = moment().tz("America/Los_Angeles").format("hh:mm A") + ": Los Angeles";
    var connecticut = moment().tz("America/New_York").format("hh:mm A") + ": Connecticut";
    var lagos = moment().tz("Africa/Lagos").format("hh:mm A") + ": Lagos";
    var nairobi = moment().tz("Africa/Nairobi").format("hh:mm A") + ": Nairobi";
    var manila = moment().tz("Asia/Manila").format("hh:mm A") + ": Manila";

    bot.reply(message, "Reaction Team Time Zones");
    bot.reply(message, losAngeles);
    bot.reply(message, connecticut);
    bot.reply(message, lagos);
    bot.reply(message, nairobi);
    bot.reply(message, manila);
});


/* Basic custom responses
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
function botReply(hashtags, responses) {
    controller.hears(hashtags, 'direct_message,direct_mention,mention,message_received,ambient', function (bot, message) {
        var botResponse = responses[Math.floor(Math.random() * responses.length)];
        bot.reply(message, botResponse);
    });
}

// Example:
/*
botReply(['#foo', '#bar'], [
    'baz',
    'fatigued'
]);
*/

/********************************************************************************************


:::::::::  ::::::::::     :::     :::::::::      ::::::::::: :::    ::: ::::::::::: ::::::::
:+:    :+: :+:          :+: :+:   :+:    :+:         :+:     :+:    :+:     :+:    :+:    :+:
+:+    +:+ +:+         +:+   +:+  +:+    +:+         +:+     +:+    +:+     +:+    +:+
+#++:++#:  +#++:++#   +#++:++#++: +#+    +:+         +#+     +#++:++#++     +#+    +#++:++#++
+#+    +#+ +#+        +#+     +#+ +#+    +#+         +#+     +#+    +#+     +#+           +#+
#+#    #+# #+#        #+#     #+# #+#    #+#         #+#     #+#    #+#     #+#    #+#    #+#
###    ### ########## ###     ### #########          ###     ###    ### ########### ########


Hey!... Keep this list alphabetized!!!
********************************************************************************************/


botReply(['#afterlunch'], [
    'http://new.tinygrab.com/219da34c650c638ab5b863b2fc1b53261c3e9af36d.png'
]);

botReply(['#bagelhead'], [
    'http://media.galaxant.com/000/157/683/desktop-1428330798.jpg'
]);

botReply(['#baptized'], [
    'http://ara-vision.com/gif-library/fail/baptized.gif'
]);

botReply(['#buzzword'], [
	'Mobilegeddon',
	'Low-hanging fruit',
	'Small wins',
	'Deep Learning',
	'Auto-Scaling',
	'Agile Hybrid',
	'Inclusive',
	'YotaBytes',
	'Dark Data',
	'Phablet',
	'High Availability',
	'Early-stage',
	'Distributive',
	'Bleeding Edge',
	'Fuck you money',
	'Code Ninja',
	'Crushing it',
	'MBA',
	'Vanity Metrics',
	'10x Engineer',
	'World Class WordPress',
	'Cutting Edge',
	'Best-in-class',
	'The Cloud',
	'boil the ocean',
	'glamour metrics',
	'gamification',
	'bricks and clicks',
	'dot-bomb',
	'Ready. Fire. Aim.',
	'value-add',
	'what’s the ask?',
	'unicorn',
	'ROI',
	'bring to the table',
	'cross-pollinate',
	'knee deep',
	'Clickthrough',
	'Close the loop',
	'IOT',
	'Incubators',
	'Startup Accelerator',
	'Seed Round',
	'Evangelist',
	'Wheelhouse',
	'Biowearables',
	'Blockchain',
	'Circle Back',
	'Seamless',
	'Robust and Scalable',
	'ReactJS / React Native',
	'AI',
	'Quantum Computing',
	'High Availability',
	'Acquihire',
	'Pivot',
	'Curated',
	'ISBAT',
	'Cashflow-positive',
	'Bleeding Edge',
	'Churn Rate',
	'Exit Strategy',
	'Minimum Viable Product (MVP)',
	'IxD\'r',
	'Vertical Slice',
  'Serverless'
]);

botReply(['#casinonight'], [
    'http://media1.giphy.com/media/Ef7aMJT141V7i/giphy.gif'
]);

botReply(['#coffee', '#whoops'], [
    'http://i.giphy.com/tId80dcdksC8U.gif'
]);

botReply(['#fatigued', '#fatigado'], [
    'http://new.tinygrab.com/219da34c65fb5ffb028e32a00d430b318c38a5ca70.jpg',
    'http://gph.is/1gVrqmL',
    'http://p.fod4.com/p/media/8e626ba361/wjN8hJWWSnqXwVYvp4ZH_Kid%20Table%20Slide.gif'
]);

botReply(['#grim'], [
    'http://i.imgur.com/cIwwfJ9.gif'
]);

botReply(['#hacked'], [
    'http://i.imgur.com/ye5udHZ.gif'
]);

botReply(['#lol'], [
    'https://s-media-cache-ak0.pinimg.com/originals/80/39/29/803929ecb9179dd8ac2864079d9224a6.jpg',
    'https://media.giphy.com/media/jQmVFypWInKCc/giphy.gif',
    'https://giphy.com/gifs/new-O5NyCibf93upy',
    'http://gph.is/1cYzUmd',
    'http://gph.is/1KWzB0G',
    'http://http://static.comicvine.com/uploads/original/6/69852/4035043-783811_o.gif',
    'http://i.imgur.com/KSCJiW8.gif',
    'http://gph.is/19gSXXm',
    'http://gph.is/1mt6nnw',
    'http://gph.is/1SBDnOP',
    'http://gph.is/1hJ4ovZ',
    'http://i.imgur.com/kbtV8zN.gif'
]);

botReply(['#mediocre'], [
    'http://i2.kym-cdn.com/photos/images/original/001/025/902/7d5.gif'
]);

botReply(['#mindblown'], [
    'http://ara-vision.com/gif-library/mind-blown/kramer-mind-blown.gif',
    'http://ara-vision.com/gif-library/mind-blown/magic.gif',
    'http://ara-vision.com/gif-library/mind-blown/mind-blown-2.gif',
    'http://ara-vision.com/gif-library/seinfeld/kramer-shocked-2.gif',
    'http://ara-vision.com/gif-library/mind-blown/mind-blown.gif'
]);

botReply(['#obamajam'], [
    ':car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car: :car: :bus: :truck: :bus: :car:'
]);

botReply(['#pandemonium'], [
    'http://pop.h-cdn.co/assets/15/21/1431967859-madmax-guitar.gif',
    'http://i.imgur.com/6WFjtDB.gif%20alt='
]);

botReply(['#ripian'], [
    'http://drop.itsmeara.com/1cW4x/5EABuhjM',
    'http://d.pr/i/1eBnz'
]);

botReply(['#ripvinson'], [
    'https://www.youtube.com/watch?v=o4T_miEDCMQ&feature=youtu.be'
]);

botReply(['#ripjon'], [
    'http://drop.itsmeara.com/ASFt/3yUgMJH8',
    'https://www.youtube.com/watch?v=0hoJ60Vxaf0&feature=youtu.be'
]);

botReply(['#sadtrombone', '#wompwomp'], [
    'https://wompwompwomp.com/'
]);

botReply(['#shotsfired'], [
    'http://ara-vision.com/gif-library/favorites/shots-fired-compilation.gif',
    'https://localtvwnep.files.wordpress.com/2012/12/shots_fired.jpg'
]);

botReply(['#stabbed'], [
    'http://i.imgur.com/ey5hIyJ.gif'
]);

botReply(['#strugglelunch'], [
    'The Point',
    'Signature Cafe',
    'An automated order from "Bulan Thai" damn it',
    'An apple from the basket in the kitchen',
    'Chipotle (RIP)',
    'A swig of Coffee Mate',
    'Xenomorph Grill',
    'Bowl of Fruity Pebbles',
    'Cap’n Crunch',
    'That weird fish thing from the Point\'s Facebook page'
]);

// UPDATE: are this around?
botReply(['#struggleplate'], [
    'http://2.bp.blogspot.com/-4aTCryIaPY8/TdXkuS41InI/AAAAAAAAGdQ/iKcrrTKoC2o/s1600/DSC06503_2.JPG',
    'http://i.imgur.com/tdUNOYj.jpg',
    'http://i.imgur.com/RnvbRg3.jpg',
    'http://i.imgur.com/5RbGmJb.jpg',
    'http://i.imgur.com/cshWr5P.jpg',
    'http://i.imgur.com/SVjJiO1.jpg',
    'http://i.imgur.com/rGh7S0p.jpg',
    'http://i.imgur.com/bRglqp4.jpg',
    'http://i.imgur.com/wAEH2nA.jpg',
    'http://i.imgur.com/sW7QxJx.jpg',
    'http://38.media.tumblr.com/d04494b57e344367e55bbc2fd357f6fa/tumblr_n9b5pyRSQm1rwt6qvo3_400.jpg'
]);

// UPDATE: find this fish
botReply(['#strugglemvp', '#cilantrofish'], [
    'http://i.ato.la/Q3BS'
]);

botReply(['#surf'], [
    'http://cd8ba0b44a15c10065fd-24461f391e20b7336331d5789078af53.r23.cf1.rackcdn.com/baldursgate.vanillaforums.com/FileUpload/2e/36ce2b9454f5917b1333fe5ed06d1c.gif'
]);

// UPDATE: to our Google Hangouts
botReply(['#zoomitup'], [
    'https://godaddy.zoom.us/j/4572573353'
]);
// UPDATE: to our Google Hangouts
botReply(['#test'], [
    'https://www.rover.com/blog/wp-content/uploads/2015/05/dog-candy-junk-food-599x340.jpg'
]);


/* Helper Functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
/*** http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3 **/
function getDistance(startCoords, endCoords) {

    var rad = function (x) {
        return x * Math.PI / 180;
    };

    var R = 6378137; // Earth’s mean radius in meters

    var dLat = rad(endCoords.lat - startCoords.lat);
    var dLong = rad(endCoords.lng - startCoords.lng);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(startCoords.lat)) * Math.cos(rad(endCoords.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var d = R * c / 1000;

    return d; // returns the distance in kilometers
}

function getHHMM(decimalHours) {
    var output = "";
    var hours = Math.floor(decimalHours);
    var minutes = (Math.floor(decimalHours * 60)) - (hours * 60);

    if (hours == 1) {
        output += "1 hour, ";
    } else if (hours > 1) {
        output += hours + " hours, ";
    }
    output += minutes + " minutes";
    return output;
}


function saveSlackInfo(_bot) {
    // Save Slack Users
    // @ https://api.slack.com/methods/users.list
    _bot.api.users.list({}, function (err, response) {
        if (response.hasOwnProperty('members') && response.ok) {
            var total = response.members.length;
            for (var i = 0; i < total; i++) {
                var member = response.members[i];
                fullTeamList.push({
                    name: member.name,
                    id: member.id
                });
            }
        }
    });

    // Save Slack Channels
    // @ https://api.slack.com/methods/channels.list
    _bot.api.channels.list({}, function (err, response) {
        if (response.hasOwnProperty('channels') && response.ok) {
            var total = response.channels.length;
            for (var i = 0; i < total; i++) {
                var channel = response.channels[i];
                fullChannelList.push({
                    name: channel.name,
                    id: channel.id
                });
            }
        }
    });
}
