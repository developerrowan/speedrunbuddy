import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import RenameSubcommand from './subcommands/moderation/rename.subcommand';
import EnableDisableSubcommand from './subcommands/moderation/enabledisable.subcommand';
import Constants from '../constants';

export default class SpeedrunbuddyCommand implements ICommand {
  public name = 'speedrunbuddy';
  public regex =
    /!([a-zA-Z0-9]+)(?:[^\w]+)?([a-zA-Z0-9]+)(?:[^\w]+)?([a-zA-Z0-9]+)(?:[^\w]+)?([a-zA-Z0-9]+)?/;
  public listenInBotChat = true;

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    if (
      !properties.argument ||
      properties.argument === 'help' ||
      properties.argument === 'commands'
    ) {
      Speedrunbuddy.client.say(
        wrapper.channel.ircChannelName,
        Constants.INTRODUCTORY_MSG
      );
      return;
    }

    switch (properties.argument) {
      case 'rename':
      case 'renamecommand':
        new RenameSubcommand().execute(wrapper, properties);
        break;
      case 'disable':
      case 'disablecommand':
        new EnableDisableSubcommand().execute(wrapper, properties);
        break;
      case 'enable':
      case 'enablecommand':
        new EnableDisableSubcommand().execute(wrapper, properties, true);
        break;
    }
  }
}
