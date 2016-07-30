var Twit = require('twit'); // Twitter API Client

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
    // Own Twitter name
    var SCREEN_NAME = data.screen_name;

    // User Stream
    var stream = T.stream('user');

    stream.on('message', function (msg) { console.log("msg received") });

    // follow event handler
    stream.on('follow', function (eventMsg) {
      if (eventMsg.target.screen_name == SCREEN_NAME) { // The account has a new follower
        var newfollower = eventMsg.source.screen_name;
        console.log("[STREAM] New follower: @"+newfollower);

        // Send a Direct Message
        var textDM = "Thanks for following me."
        T.post('direct_messages/new', { screen_name: newfollower, text: textDM }, function(err, data, response) {
          if(!err && response == 200) { // TODO Test if it's ok
            console.log("[STREAM] DM sent to @"+newfollower);
          } else {
            console.log("[ERR] Can't send the DM to @"+newfollower);
            console.log(response);
            console.log(data);
          }
        })
      }
    })

  } else {
    console.log("[ERR] Can't verify credentials");
    console.log(response);
    console.log(data);
  }
})
