import { ClientWrapper, CommandProperties } from './command-dispatch.service';
import { AuthService, DatabaseService, UtilityService } from './';
import * as constants from '../constants';
import { DecoratedClient } from '@twurple/auth-tmi/lib/client';
import Speedrunbuddy from '../speedrunbuddy';

export type TwitchChannelInfo = {
  game: string;
  title: string;
};

export type Channel = {
  ircChannelName: string;
  channelName: string;
  displayName: string;
};

export default abstract class ChannelService {
  public static async joinCommand(
    wrapper: ClientWrapper,
    _: CommandProperties
  ) {
    const client = Speedrunbuddy.client;
    const channel = wrapper.channel;
    const commander = wrapper.userstate.username;

    if (await ChannelService.doesChannelExist(commander)) {
      client.say(
        channel.ircChannelName,
        "Thanks for inviting me over, but I'm actually already in your chat!"
      );
      return;
    }

    try {
      await client.join(commander);
    } catch (e: unknown) {
      client.say(channel.ircChannelName, constants.SOMETHING_WENT_WRONG_MSG);
      return;
    }

    const addedChannelToDatabase = await ChannelService.addChannel(commander);

    if (addedChannelToDatabase) {
      client.say(
        channel.ircChannelName,
        "Sweet, I've joined your chat! Thanks for inviting me!"
      );
      client.say(`#${commander}`, constants.INTRODUCTORY_MSG);
    } else {
      client.say(channel.ircChannelName, constants.SOMETHING_WENT_WRONG_MSG);
    }
  }

  public static async leaveCommand(
    wrapper: ClientWrapper,
    _: CommandProperties
  ) {
    const client = Speedrunbuddy.client;
    const channel = wrapper.channel;
    const commander = wrapper.userstate.username;

    if (!(await ChannelService.doesChannelExist(commander))) {
      client.say(
        channel.ircChannelName,
        "I'm not in your chat, so I can't leave!"
      );
      return;
    }

    const result = await ChannelService.removeChannel(commander, client);

    if (result) {
      client.say(
        channel.ircChannelName,
        "I'm sorry to go, but I hope I can return soon! I've left your channel, and I won't attempt to rejoin it unless you tell me to."
      );
    } else {
      client.say(channel.ircChannelName, constants.SOMETHING_WENT_WRONG_MSG);
    }
  }

  public static helpCommand(wrapper: ClientWrapper, _: CommandProperties) {
    Speedrunbuddy.client.say(
      wrapper.channel.ircChannelName,
      constants.INTRODUCTORY_MSG
    );
  }

  public static async getChannel(channel: string): Promise<Channel> {
    const niceChannelName = UtilityService.splitHash(channel);

    return {
      ircChannelName: channel,
      channelName: niceChannelName,
      displayName: await ChannelService.getDisplayName(niceChannelName),
    };
  }

  public static setChannelLastUsedDate(channelName: string): Promise<void> {
    return DatabaseService.pool
      .query('UPDATE channels SET last_use_date = $1 WHERE username = $2', [
        new Date(),
        channelName,
      ])
      .then(() => {
        return;
      });
  }

  public static doesChannelExist(channelName: string): Promise<boolean> {
    return DatabaseService.pool
      .query('SELECT * FROM channels WHERE username = $1', [channelName])
      .then(res => res.rowCount === 1);
  }

  public static getChannelsToJoin(): Promise<string[]> {
    return DatabaseService.pool
      .query('SELECT username FROM channels')
      .then(res => {
        const channelsList: string[] = [];

        res.rows.map(row => channelsList.push(row.username));

        return channelsList;
      });
  }

  public static getDisplayName(username: string): Promise<string> {
    return DatabaseService.pool
      .query('SELECT display_name FROM channels WHERE username = $1', [
        username,
      ])
      .then(res => res.rows[0].display_name);
  }

  public static getUserId(username: string): Promise<string | undefined> {
    return DatabaseService.pool
      .query('SELECT user_id FROM channels WHERE username = $1', [username])
      .then(res => (res.rowCount === 1 ? res.rows[0].user_id : undefined));
  }

  public static async getTwitchChannelInfo(
    username: string
  ): Promise<TwitchChannelInfo | undefined> {
    const channelId: string | undefined = await ChannelService.getUserId(
      username
    );

    if (!channelId) return undefined;

    return fetch(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`,
      {
        headers: {
          Authorization: `Bearer ${await AuthService.accessToken}`,
          'Client-ID': process.env.TWITCH_CLIENT_ID,
        },
      }
    ).then(async response => {
      if (response.ok) {
        const twitch = await response.json();

        return {
          game: twitch.data[0].game_name,
          title: twitch.data[0].title,
        } as TwitchChannelInfo;
      }

      return undefined;
    });
  }

  public static async addChannel(channelName: string): Promise<boolean> {
    return fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
      headers: {
        Authorization: `Bearer ${await AuthService.accessToken}`,
        'Client-ID': process.env.TWITCH_CLIENT_ID,
      },
    }).then(async response => {
      if (response.ok) {
        const twitch = await response.json();

        if (channelName == twitch.data[0].login) {
          const result = await DatabaseService.pool.query(
            'INSERT INTO channels (username, display_name, user_id) VALUES ($1, $2, $3)',
            [channelName, twitch.data[0].display_name, twitch.data[0].id]
          );

          if (result.rowCount === 1) {
            return true;
          }
        }
      }

      return false;
    });
  }

  public static async removeChannel(
    username: string,
    client: DecoratedClient
  ): Promise<boolean> {
    try {
      await client.part(username);
    } catch (e: unknown) {
      // This block can be empty due to an issue with part not working. This is handled above.
    }

    const removeResult = await DatabaseService.pool.query(
      'DELETE FROM channels WHERE username = $1',
      [username]
    );

    if (removeResult.rowCount === 1) {
      return true;
    }

    return false;
  }
}
