import { AuthService, DatabaseService, UtilityService } from './';
import { DecoratedClient } from '@twurple/auth-tmi/lib/client';

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

    const userId: string | undefined = await this.getUserId(username);

    if (!userId) return false;

    try {
      await DatabaseService.pool.query('BEGIN');

      await DatabaseService.pool.query(
        'DELETE FROM command_preferences WHERE user_id = $1',
        [userId]
      );

      await DatabaseService.pool.query(
        'DELETE FROM channels WHERE user_id = $1',
        [userId]
      );

      await DatabaseService.pool.query('COMMIT');

      return true;
    } catch (e: unknown) {
      await DatabaseService.pool.query('ROLLBACK');

      return false;
    }
  }
}
