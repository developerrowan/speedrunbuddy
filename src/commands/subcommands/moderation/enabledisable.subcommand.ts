import Constants from '../../../constants';
import { DatabaseService } from '../../../services';
import ChannelService, { Channel } from '../../../services/channel.service';
import CommandDispatchService, {
  ClientWrapper,
  CommandProperties,
} from '../../../services/command-dispatch.service';
import Speedrunbuddy from '../../../speedrunbuddy';
import ICommand from '../../ICommand';

export default class EnableDisableSubcommand implements ICommand {
  public name = '';

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties,
    enable?: boolean
  ): Promise<void> {
    const channel: Channel = wrapper.channel;

    if (
      !wrapper.userstate.mod &&
      wrapper.userstate.username !== channel.channelName
    )
      return;

    const userId = await ChannelService.getUserId(channel.channelName);
    if (!userId) return;

    const commandName: string | undefined = properties.argument2;
    if (!commandName) return;

    const commandExists: ICommand | undefined =
      CommandDispatchService.doesCommandExist(commandName);

    if (!commandExists) {
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        `Sorry, it doesn't look like there's a command called "${commandName}".`
      );
      return;
    }

    if (commandName === 'speedrunbuddy') {
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        enable
          ? 'My command is always enabled!'
          : "You can't disable my command - how would you disable future ones? :)"
      );
      return;
    }

    const result = await DatabaseService.pool.query(
      'INSERT INTO command_preferences (user_id, default_command_name, command_active) VALUES ($1, $2, $3) ON CONFLICT (user_id, default_command_name) DO UPDATE SET command_active = $3',
      [userId, commandName, enable]
    );

    if (result.rowCount === 1) {
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        `Command !${commandName} has been ${enable ? 'en' : 'dis'}abled.`
      );
    } else {
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        Constants.SOMETHING_WENT_WRONG_MSG
      );
    }
  }
}
