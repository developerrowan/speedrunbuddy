import { Userstate } from 'tmi.js';
import ChannelService, { Channel } from './channel.service';
import * as constants from '../constants';
import Speedrunbuddy from '../speedrunbuddy';

export type CommandProperties = {
  raw: string;
  command: string;
  quotedArgument: string;
  argument: string;
};

export type ClientWrapper = {
  channel: Channel;
  userstate: Userstate;
};

export type CommandFunction = (
  wrapper: ClientWrapper,
  commandProperties: CommandProperties
) => void;

export type Command = {
  commandName: string;
  commandAlias?: string;
  commandAction: CommandFunction;
  listenInBotChat?: boolean;
  botChatOnly?: boolean;
};

export default class CommandDispatchService {
  private static _commands: Command[] = [];

  public static register(command: Command): void {
    if (
      !command.commandName ||
      this._commands.find(c => c.commandName === command.commandName)
    )
      return;

    this._commands.push(command);
  }

  public static registerAll(commands: Command[]): void {
    for (let i = 0; i < commands.length; i++) {
      this.register(commands[i]);
    }
  }

  public static async execute(
    message: string,
    wrapper: ClientWrapper
  ): Promise<void> {
    const isCommand = constants.regexpCommand.test(message);

    if (!isCommand) return;

    const regexProperties = message.match(constants.regexpCommand);

    if (!regexProperties) return; // TODO: send client an err msg

    const commandProperties = {
      raw: regexProperties[0],
      command: regexProperties[1],
      quotedArgument: regexProperties[2],
      argument: regexProperties[3]?.trim(),
    } as CommandProperties;

    const commandExists: Command | undefined =
      CommandDispatchService._commands.find(
        c =>
          c.commandName === commandProperties.command ||
          c.commandAlias === commandProperties.command
      );

    if (!commandExists) return;

    // If this command can only be run in the bot's chat and is ran elsewhere, ignore
    if (
      commandExists.botChatOnly &&
      wrapper.channel.channelName !== Speedrunbuddy.client.getUsername()
    )
      return;

    // If the bot shouldn't listen to the command in its own chat and this command is in its chat, ignore
    if (
      !commandExists.botChatOnly &&
      !commandExists.listenInBotChat &&
      wrapper.channel.channelName === Speedrunbuddy.client.getUsername()
    )
      return;

    // Hacky fix for leaving a channel when part() doesn't immediately work.
    if (!(await ChannelService.doesChannelExist(wrapper.channel.channelName)))
      return;

    commandExists.commandAction(wrapper, commandProperties);
  }
}
