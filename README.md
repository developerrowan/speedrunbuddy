# speedrunbuddy
A Twitch bot to easily get a streamer's PBs in the game they're currently playing.

<img src="https://user-images.githubusercontent.com/22936904/213878348-9d8a5a86-e6c3-47ac-9349-1ccc1613d87f.png" width="100" height="100" />
powered by <a href="https://therun.gg/" target="_blank">therun.gg</a>.

## Get Started
If you aren't already, start using <a href="https://therun.gg/" target="_blank">TheRun</a>!

To get the bot to join your chat, head to the bot's own chat at <a href="https://www.twitch.tv/speedrunbuddy">https://www.twitch.tv/speedrunbuddy</a> and type `!join`.

![image](https://user-images.githubusercontent.com/22936904/213878994-b415a500-fc35-4855-8e3c-9ef052052997.png)

You should receive a message saying the bot joined, and it should say hello in your chat!

![image](https://user-images.githubusercontent.com/22936904/213879010-a17eb457-b735-4664-9caa-92adfd473620.png)

## Commands

### `!pb [category]` - Get the streamer's PB for the game they are currently playing
You can optionally provide a category to this command, such as `!pb 70 star`, but this is only if you want to see a PB for a different category than the streamer is curently running.

**As long as the category is in the stream title, the bot can automatically detect the category without the need to specify a category.**

If no category is provided by the user, and the bot cannot find the category in the title, it will default to the first category it finds from TheRun.

### `!pbs` - Returns a URL to the streamer's TheRun profile

### `!speedrunbuddy` - Shows the introductory message which takes you to this very page

### `!join` - Make the bot join your channel. Can ONLY be ran in the bot's own chat

### `!join` - Make the bot leave your channel. Can ONLY be ran in the bot's own chat

## Troubleshooting
### Something went wrong
If you get a message saying something went wrong when trying to get the bot to join your channel, wait a couple minutes and try again. If the issue keeps occurring, please contact me so I may investigate!

![image](https://user-images.githubusercontent.com/22936904/213878505-e7380ae8-595b-4cf8-8a7c-28e273ac66f7.png)

### Couldn't find any runs
Make sure you've uploaded a run to TheRun!

![image](https://user-images.githubusercontent.com/22936904/213879468-7adf787f-fad1-4b30-aabb-5361624ff00a.png)

## Security and Privacy
When the bot joins your channel, some very basic information is collected and stored about your channel:
  * Your username
  * Your display name
  * Your user ID
  * The date the bot joined your channel
  * The bot reports when your channel last used its functionality, but only in the form of a date - logs are not kept. This is the only usage statistic collected, and does not uniquely identify any one user or action.
  
When the bot leaves your channel, ALL of this is cleared. Your information is deleted entirely from the database.
