import { Userstate } from 'tmi.js';
import ChannelService, { Channel } from './channel.service';
import * as constants from '../constants';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from '../commands/ICommand';
import path from 'path';
import { readdirSync } from 'fs';
import UtilityService from './utility.service';

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

export default class CommandDispatchService {
  private static _commands: ICommand[] = [];
  private static _skippedCommands: number;

  public static register(command: ICommand): void {
    if (this._commands.find(c => c.name === command.name)) {
      this._skippedCommands++;
      return;
    }

    this._commands.push(command);
  }

  public static async registerAll(): Promise<void> {
    const commandDirectory: URL = new URL('../commands', import.meta.url);

    const files = readdirSync(commandDirectory).filter(filename =>
      filename.endsWith('.command.ts')
    );

    for (let i = 0; i < files.length; i++) {
      this.register(
        new (await import(path.join(commandDirectory.href, files[i]))).default()
      );
    }

    console.info(
      `${this._commands.length} ${UtilityService.pluralise(
        'command',
        this._commands.length
      )} registered successfully.`
    );

    if (this._skippedCommands > 0) {
      console.warn(
        `Skipped ${this._skippedCommands} ${UtilityService.pluralise(
          'command',
          this._skippedCommands
        )}.`
      );
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

    const commandExists: ICommand | undefined =
      CommandDispatchService._commands.find(
        c =>
          c.name === commandProperties.command ||
          c.alias === commandProperties.command
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

    ChannelService.setChannelLastUsedDate(wrapper.channel.channelName);

    commandExists.execute(wrapper, commandProperties);
  }
}
