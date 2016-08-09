# Twitter Redirection Bot 🤖
This is a bot that keeps track of an old Twitter account, informs to new followers
and mentions about the new account info. This bot is useful for me because I wanted
to change my Twitter username. If you want to change yours, read [this](http://www.labnol.org/internet/change-twitter-handle-name) first.

## Features

I tried to make a fully functional bot. The core is `app/bot.js`. Some of its awesome features are:
- [Streaming API](https://dev.twitter.com/streaming/overview) usage reducing single requests and avoids being rate limited.
- Replying when someone mentions the old username. Just once per conversation (we don't want to fed up people).
- Answering DM (direct messages).
- Sending a DM if the account gets a new follower.

## Installing and deploying

First you need to install [nodejs](https://nodejs.org).

In order to configure the access to the [Twitter API](https://dev.twitter.com/overview/documentation), you should create the file
`app/secret.json`with access tokens and keys (you shouldn't share this file). It
 should be like this:

```json
consumer_key:        "...",
consumer_secret:     "...",
access_token:        "...",
access_token_secret: "...",
timeout_ms:          60*1000
```

If you want to test the bot you can simply run:

```shell
./setup.sh
node app
```

**NOTE**: My `package.json` file is absolutely simple. You may want to change it if
you are going to deploy it in a PaaS.

## Why Nodejs?

I'm using nodejs to implement this bot just because I'm starting to learn about
node. I also wanted to create this bot, so I did. Then, I took advantage of the opportunity and solved all problems at once. Would Google Scripts be a better solution? Maybe yes. Could I solve this with [zapier](https://zapier.com/) or some other alternatives? Absolutely yes, but I prefer to learn.

### Contribution

PRs and reporting issues are really welcome.

### License
The content of this repository is licensed under a MIT [LICENSE](LICENSE).
