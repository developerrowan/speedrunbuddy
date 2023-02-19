import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { ChannelService } from '../services';
import * as constants from '../constants';

export default class LeaveCommand implements ICommand {
  public name = 'leave';
  public botChatOnly = true;

  public async execute(
    wrapper: ClientWrapper,
    _: CommandProperties
  ): Promise<void> {
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
}
