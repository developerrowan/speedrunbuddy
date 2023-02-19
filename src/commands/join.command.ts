import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { ChannelService } from '../services';
import * as constants from '../constants';

export default class JoinCommand implements ICommand {
  public name = 'join';
  public botChatOnly = true;

  public async execute(
    wrapper: ClientWrapper,
    _: CommandProperties
  ): Promise<void> {
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
}
