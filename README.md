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

### A Brief Note on "Game and Category Negotiation"
The majority of stats commands have a feature called "game and category negotation" to handle fetching stats. This sounds fancier than it actually is. All this means is the bot will attempt to fetch stats for a specific game and / or category based on what the user does. Negotiation occurs in the following order:

 - Check to see if the user has provided an argument to the command, such as "Super Mario 64 70 star." If so, the bot will use this information to either return stats for that game and category or inform the user it doesn't exist.
 - Check to see if the streamer is live on The Run. If they are, the game and category can be retrieved this way.
 - Get the game from Twitch, and the category from the stream title.
 - If the stream title doesn't contain a known category, try to find an Any% category for the game.
 - Finally, return the first found category for the Twitch game.
 
If a command below says (GCN) next to it, it means you can:
 - Use the command without arguments, to allow the bot to automatically negotiate the game and category, or
 - Provide an argument to the command with either the game, category, or both you want.

### Stats

#### `!pb` (GCN) - Get the streamer's PB for the game they are currently playing
Example: `!pb sm64 16 star`

#### `!pbs` (GCN) - Returns the number of the streamer's distinct PBs, and a URL to their TheRun profile
Example: `!pbs super metroid rbo`

#### `!attempts` (GCN) - Get the streamer's total attempts, and how many of them are finished
Example: `!attempts super mario sunshine Any%`

#### `!playtime` (GCN) - Get the streamer's total playtime, or amount of time actually running the game as opposed to practicing
Example: `!playtime super mario bros`

### Management

#### `!join` - Make the bot join your channel. Can ONLY be ran in the bot's own chat

#### `!leave` - Make the bot leave your channel. Can ONLY be ran in the bot's own chat

#### `!speedrunbuddy disable [command]` - Disables a command. This can be used to prevent the use of commands whose stats you may believe could be used to shame, harass, or otherwise attack you.
Example: `!speedrunbuddy disable !attempts`

#### `!speedrunbuddy enable [command]` - Enables a command. **All command are enabled by default.**

#### `!speedrunbuddy rename [command] [newCommandName]` - Renames a command to a name of your choosing. Speedrunbuddy is meant to replace some commands, but it can be annoying if you have your own command you prefer to maintain and then two outputs appear from different bots when running a command.
Examples:
`!speedrunbuddy rename !pb !peanutbutter` - Renames `!pb` to `!peanutbutter`

`!speedrunbuddy rename !pb default` - Renames `!pb` back to `!pb` (the `default` keyword is special and will set it back to its default)

### Miscelleanous

#### `!speedrunbuddy` - Shows the introductory message which takes you to this very page

## Troubleshooting
If you run into any strange, persistent issues, please DM me on Twitter at <a href="https://twitter.com/DeveloperRowan">https://twitter.com/DeveloperRowan</a>.

### Something went wrong
If you get a message saying something went wrong when trying to get the bot to join your channel, wait a couple minutes and try again. If the issue keeps occurring, please contact me so I may investigate!

![image](https://user-images.githubusercontent.com/22936904/213878505-e7380ae8-595b-4cf8-8a7c-28e273ac66f7.png)

### I've royally screwed up (somehow). How can I fix it?
You can have the bot leave and rejoin your channel at anytime, and it could be helpful to fix issues that could come up. The bot leaving your channel does NOT affect any of your stats, as these are kept by The Run. However, the bot leaving your channel WILL clear any of your command preferences.

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

The bot experiences a brief 5-10 minute downtime every day at 00 (midnight) EST to automatically restart itself and apply new changes. Apologies for any interruptions this causes to your experience during this time!
