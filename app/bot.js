var Twit = require('twit'); // Twitter API Client See: https://www.npmjs.com/package/twit

const TWEETLEN = 140;

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
    console.log("[INFO] Verified credentials");

    // Own Twitter name
    var SCREEN_NAME = data.screen_name;
    console.log("[INFO] Twitter user: " + SCREEN_NAME);

    // User Stream
    var stream = T.stream('user');

    // stream.on('message', function (msg) { console.log("[INFO] Msg received") });

    // follow event handler
    stream.on('follow', function (eventMsg) {
      if (eventMsg.target.screen_name === SCREEN_NAME) { // The account has a new follower.
        var newfollower = eventMsg.source.screen_name;
        console.log("[STREAM] New follower: @"+newfollower);

        // Send a Direct Message. See: https://dev.twitter.com/rest/reference/post/direct_messages/new
        var textDM = "Thanks for following me."

        T.post('direct_messages/new', { screen_name: newfollower, text: textDM }, function(err, data, response) {
          if(!err) {
            console.log("[STREAM] DM sent to @"+newfollower);
          } else {
            console.log("[ERR] Can't send the DM to @"+newfollower);
            console.log(data);
          }
        })
      }
    })

    // tweet event handler. Emitted each time a tweet comes into the stream.
    stream.on('tweet', function (tweet) {
      if (mentionsMe(SCREEN_NAME, tweet.entities.user_mentions)) { // The tweet is a mention.
        var sender = tweet.user.screen_name;
        console.log("[STREAM] New mention from: @"+sender);

        // Send a reply. See: in_reply_to_status_id https://dev.twitter.com/rest/reference/post/statuses/update
        var textReply = "please follow <other>";
        var reply = makeReply(sender, tweet.entities.user_mentions, textReply, SCREEN_NAME);

        T.post('statuses/update', { status: reply, in_reply_to_status_id: tweet.id }, function(err, data, response) {
          if(!err) {
            console.log("[STREAM] Reply sent: \""+reply+"\"");
          } else {
            console.log("[ERR] Can't send the reply");
            console.log(data);
          }
        })
      }
    })

    // stream.err // TODO

  } else {
    console.log("[ERR] Can't verify credentials");
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
