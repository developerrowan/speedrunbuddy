import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import * as constants from '../constants';

export default class JoinCommand implements ICommand {
  public name = 'speedrunbuddy';
  public listenInBotChat = true;

  public async execute(
    wrapper: ClientWrapper,
    _: CommandProperties
  ): Promise<void> {
    Speedrunbuddy.client.say(
      wrapper.channel.ircChannelName,
      constants.INTRODUCTORY_MSG
    );
  }
}
