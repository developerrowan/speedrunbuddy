import Constants from '../../../constants';
import { DatabaseService } from '../../../services';
import ChannelService, { Channel } from '../../../services/channel.service';
import CommandDispatchService, {
  ClientWrapper,
  CommandProperties,
} from '../../../services/command-dispatch.service';
import Speedrunbuddy from '../../../speedrunbuddy';
import ICommand from '../../ICommand';

export default class RenameSubcommand implements ICommand {
  public name = '';

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const channel: Channel = wrapper.channel;

    if (wrapper.userstate.username !== channel.channelName) return;

    const userId = await ChannelService.getUserId(channel.channelName);
    if (!userId) return;

    const commandName: string | undefined = properties.argument2;
    if (!commandName) return;

    let newCommandName: string | undefined = properties.argument3;
    if (!newCommandName) return;

    newCommandName = newCommandName.replace('!', '');

    if (newCommandName.length > 25) {
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        'Your new command name is too long! Please be sure it is 25 characters or less.'
      );
      return;
    }

    const commandExists: ICommand | undefined =
      CommandDispatchService.doesCommandExist(commandName);
    const hasCustomCommandName: ICommand | undefined =
      await CommandDispatchService.doesCommandHaveCustomName(
        commandName,
        userId
      );

    if (commandExists || hasCustomCommandName) {
      const originalCommandName =
        commandExists?.name || hasCustomCommandName?.name;
      const finalCommandName =
        newCommandName === 'default' || newCommandName === originalCommandName
          ? null
          : newCommandName;

      const result = await DatabaseService.pool.query(
        'INSERT INTO command_preferences (user_id, default_command_name, custom_command_name) VALUES ($1, $2, $3) ON CONFLICT (user_id, default_command_name) DO UPDATE SET custom_command_name = $3',
        [userId, originalCommandName, finalCommandName]
      );

      if (result.rowCount === 1) {
        Speedrunbuddy.client.say(
          channel.ircChannelName,
          `Command !${commandName} has been renamed to !${
            finalCommandName === null ? originalCommandName : finalCommandName
          }.`
        );
      } else {
        Speedrunbuddy.client.say(
          channel.ircChannelName,
          Constants.SOMETHING_WENT_WRONG_MSG
        );
      }
    } else {
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        `I couldn't find a command called "${commandName}".`
      );
    }
  }
}
