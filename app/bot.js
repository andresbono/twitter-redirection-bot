var Twit = require('twit'); // Twitter API Client See: https://www.npmjs.com/package/twit

const TWEETLEN = 140;

const NEW_USERNAME = '';

// Internationalization
const DEFAULT_LANG = 'en'; // The default language must exist in textReply and textDM objects.

const textReply = {
  en: `follow @${NEW_USERNAME}, please.`,
  es: `sigue a @${NEW_USERNAME}, por favor.`
};

const textDM = {
  en: 'Thanks for following me.',
  es: 'Gracias por seguirme.'
};


// import secret.json file
var secret = require("./secret");
/* that should look like this:
{
  consumer_key:        "...",
  consumer_secret:     "...",
  access_token:        "...",
  access_token_secret: "...",
  timeout_ms:          60*1000 // optional HTTP request timeout to apply to all requests.
}
*/

// Make a new Twit object
var T = new Twit(secret);


T.get('account/verify_credentials', null, function(err, data, response) {
  if(!err) {
    console.log("[INFO] Credentials verified");

    // Twitter name
    var SCREEN_NAME = data.screen_name;
    console.log("[INFO] Twitter user: " + SCREEN_NAME);

    // User Stream
    var stream = T.stream('user');

    stream.on('message', function (msg) { console.log("[INFO] Msg received\n", msg) });

    // Emitted when the response is received from Twitter.
    stream.on('connected', function () {
      console.log('[INFO] Stream connected');
    })

    // follow event handler
    stream.on('follow', function (eventMsg) {
      if (eventMsg.target.screen_name === SCREEN_NAME) { // The account has a new follower.
        var newfollower = eventMsg.source.screen_name;
        console.log("[STREAM] New follower: @"+newfollower);

        // Get source language and select text
        var lang = eventMsg.source.lang;
        if (! textDM.hasOwnProperty(lang)){ // If property doesn't exist
          lang = DEFAULT_LANG;
        }

        // Send a Direct Message. See: https://dev.twitter.com/rest/reference/post/direct_messages/new
        T.post('direct_messages/new', { screen_name: newfollower, text: textDM[lang] }, function(err, data, response) {
          if(!err) {
            console.log("[STREAM] DM sent to @"+newfollower);
          } else {
            console.log("[ERROR] Can't send the DM to @"+newfollower);
            console.log(data);
          }
        })
      }
    })

    // tweet event handler. Emitted each time a tweet comes into the stream.
    stream.on('tweet', function (tweet) {
      var sender = tweet.user.screen_name;

      // If the tweet is a mention and I'm not the source
      if (mentionsMe(SCREEN_NAME, tweet.entities.user_mentions) && ! (sender === SCREEN_NAME) ) {
        console.log("[STREAM] New mention from: @"+sender);

        // Get detected language or user language
        var lang = DEFAULT_LANG;
        if (textDM.hasOwnProperty(tweet.lang)){ // If detected language exists
          lang = tweet.lang;
        } else if (textDM.hasOwnProperty(tweet.user.lang)) {  // If user language exists
          lang = tweet.user.lang;
        }

        // Send a reply. See: in_reply_to_status_id https://dev.twitter.com/rest/reference/post/statuses/update
        var reply = makeReply(sender, tweet.entities.user_mentions, textReply[lang], SCREEN_NAME);

        // NOTE: "when working with JavaScript in particular, please make sure
        // you use the stringified IDs id_str instead of id to avoid any integer
        // overflow issues." http://stackoverflow.com/a/23789697
        // See algo: https://dev.twitter.com/overview/api/twitter-ids-json-and-snowflake
        T.post('statuses/update', { status: reply, in_reply_to_status_id: tweet.id_str }, function(err, data, response) {
          if(!err) {
            console.log("[STREAM] Reply sent: \""+reply+"\"");
          } else {
            console.log("[ERROR] Can't send the reply");
            console.log(data);
          }
        })
      }
    })

    // Emitted when an API request or response error occurs.
    stream.on('error', function (errMsg) {
      console.log('[ERROR] Stream error');
      console.log(errMsg);
    })

    // Emitted each time a limitation message comes into the stream.
    stream.on('limit', function (limitMessage) {
      console.log("[WARN] Limitation message received");
      console.log(limitMessage);
    })

    // Emitted when a reconnection attempt to Twitter is scheduled. If Twitter is having problems or we get rate limited, we schedule a reconnect according to Twitter's reconnection guidelines. The last http request and response objects are emitted, along with the time (in milliseconds) left before the reconnect occurs.
    stream.on('reconnect', function (req, res, connectInterval) {
      console.log('[WARN] Got disconnected. Scheduling reconnect');
    });

  } else {
    console.log("[ERROR] Can't verify credentials");
    console.log(data);
  }
})


function mentionsMe(my_screen_name, user_mentions) {
  var res = false;

  // Have I been mentioned in the tweet? // See: https://dev.twitter.com/overview/api/entities
  for (var i = 0; i < user_mentions.length; i++){
    if(user_mentions[i].screen_name === my_screen_name) {
      res = true;
      break;
    }
  }

  return res;
}

function makeReply(target, user_mentions, textReply, my_screen_name) {
  var users2reply = [ "@" + target ]; // Main target

  // Add the rest of the mentions
  for (var i = 0; i < user_mentions.length; i++){
    if(! (user_mentions[i].screen_name === my_screen_name)) {
      users2reply.push("@" + user_mentions[i].screen_name);
    }
  }
  // NOTE: Could be more efficient 1) push my_screen_name 2) and then pop?
  // I don't think so because, in general, the loop doesn't have many iterations

  // Delete duplicated entries using Set characteristics and join all as String
  var res = Array.from(new Set(users2reply)).join(" ");

  // Check if it is possible to send the tweet
  if( (res.length + textReply.length) <= TWEETLEN) {
    res += " " + textReply;
  } else { // If not, at least reply to the main target
    res = "@" + target + " " + textReply;
  }

  return res;
}
