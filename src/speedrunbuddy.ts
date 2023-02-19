import { RefreshingAuthProvider } from '@twurple/auth';
import { Client, ChatUserstate } from '@twurple/auth-tmi';
import {
  AuthService,
  ChannelService,
  CommandDispatchService,
} from './services';

export default abstract class Speedrunbuddy {
  private static _authProvider: RefreshingAuthProvider;
  private static _client: Client;

  public static get client(): Client {
    return this._client;
  }

  public static async start(): Promise<void> {
    this._authProvider = new RefreshingAuthProvider(
      {
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        onRefresh: async newTokenData =>
          await AuthService.refreshAccessToken(newTokenData),
      },
      await AuthService.getAuthInfo()
    );

    const channels: string[] = await ChannelService.getChannelsToJoin();

    this._client = new Client({
      authProvider: this._authProvider,
      connection: {
        reconnect: true,
        secure: true,
      },
      channels: channels,
    });

    await CommandDispatchService.registerAll();

    console.info(`Connecting to ${channels.length} channels.`);

    await this._client.connect().catch(console.error);

    console.info('Ready to accept commands!');

    this._client.on(
      'message',
      async (
        channel: string,
        userstate: ChatUserstate,
        message: string,
        self: boolean
      ) => {
        if (self || userstate['message-type'] != 'chat') return;

        CommandDispatchService.execute(message, {
          channel: await ChannelService.getChannel(channel),
          userstate,
        });
      }
    );
  }
}
