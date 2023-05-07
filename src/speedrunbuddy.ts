import { RefreshingAuthProvider } from '@twurple/auth';
import { Client, ChatUserstate } from '@twurple/auth-tmi';
import {
  AuthService,
  ChannelService,
  CommandDispatchService,
} from './services';
import { LiveRunEvent, LiveWebSocket, LiveWebSocketResponse } from 'therungg';

export default abstract class Speedrunbuddy {
  private static _authProvider: RefreshingAuthProvider;
  private static _client: Client;
  private static _websocket: LiveWebSocket;

  public static get client(): Client {
    return this._client;
  }

  public static get websocket(): LiveWebSocket {
    return this._websocket;
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

    this._websocket = new LiveWebSocket();

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

    this._websocket.onMessage = (data: LiveWebSocketResponse | undefined) => {
      if (
        !data?.user ||
        !channels.includes(`#${data.user.toLowerCase()}`) ||
        data.run.events.length === 0
      )
        return;

      let hasEnded = false;
      let bestEver = false;

      for (let i = 0; i < data.run.events.length; i++) {
        const event: LiveRunEvent = data.run.events[i];

        if (event.type === 'best_run_ever_event') bestEver = true;

        if (event.type === 'run_ended_event') hasEnded = true;
      }

      if (hasEnded && bestEver) {
        this.client.say(
          `#${data.user}`,
          `${data.user}!!! Congratulations on your new PB in ${data.run.game} ${data.run.category}! PartyHat PartyHat PartyHat`
        );
      }
    };

    setTimeout(() => {
      if (this._websocket.connection.readyState !== 1) return;

      this._websocket.connection.send('beep');
    }, 300000);
  }
}
