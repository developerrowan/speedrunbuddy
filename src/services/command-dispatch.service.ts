import { Userstate } from 'tmi.js';
import ChannelService, { Channel } from './channel.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from '../commands/ICommand';
import path from 'path';
import { readdirSync } from 'fs';
import UtilityService from './utility.service';
import DatabaseService from './database.service';
import Constants from '../constants';

export type CommandProperties = {
  raw: string;
  command: string;
  argument?: string;
  argument2?: string;
  argument3?: string;
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

    const files = readdirSync(commandDirectory).filter(
      filename =>
        filename.endsWith('.command.ts') || filename.endsWith('.command.js')
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

  public static doesCommandExist(commandName: string): ICommand | undefined {
    commandName = commandName.replace('!', '');

    return this._commands.find(
      c => c.alias === commandName || c.name === commandName
    );
  }

  public static async doesCommandHaveCustomName(
    commandName: string,
    userId: string
  ): Promise<ICommand | undefined> {
    const result = await DatabaseService.pool
      .query(
        'SELECT * FROM command_preferences WHERE user_id = $1 AND custom_command_name = $2 AND default_command_name != $2',
        [userId, commandName]
      )
      .then(res => (res.rowCount === 1 ? res.rows[0] : undefined));

    if (result) return this.doesCommandExist(result.default_command_name);
  }

  public static async isCommandDisabled(
    commandName: string,
    userId: string
  ): Promise<boolean> {
    return DatabaseService.pool
      .query(
        'SELECT * FROM command_preferences WHERE user_id = $1 AND default_command_name = $2 AND command_active = FALSE',
        [userId, commandName]
      )
      .then(res => (res.rowCount === 1 ? true : false));
  }

  public static async execute(
    message: string,
    wrapper: ClientWrapper
  ): Promise<void> {
    const channel: Channel = wrapper.channel;
    const isCommand = Constants.regexpCommand.test(message);

    if (!isCommand) return;

    let regexProperties = message.match(Constants.regexpCommand);

    if (!regexProperties) return;

    const commandName: string = regexProperties[1];

    const userId: string | undefined = await ChannelService.getUserId(
      wrapper.channel.channelName
    );

    if (!userId) {
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        Constants.SOMETHING_WENT_WRONG_MSG
      );
      return;
    }

    let commandExists: ICommand | undefined =
      this.doesCommandExist(commandName);

    const strippedCommandName: string = commandName.replace('!', '');

    if (
      !commandExists ||
      (commandExists &&
        commandExists.name !== strippedCommandName &&
        commandExists.alias !== strippedCommandName)
    )
      commandExists = await this.doesCommandHaveCustomName(commandName, userId);

    if (!commandExists) return;

    if (commandExists.regex) {
      const temp = message.match(commandExists.regex);

      if (temp) {
        regexProperties = temp;
      }
    }

    const commandProperties = {
      raw: regexProperties[0],
      command: regexProperties[1],
      argument: regexProperties[2],
      argument2: regexProperties[3],
      argument3: regexProperties[4],
    } as CommandProperties;

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

    if (await this.isCommandDisabled(commandExists.name, userId)) return;

    ChannelService.setChannelLastUsedDate(wrapper.channel.channelName);

    commandExists.execute(wrapper, commandProperties);
  }
}
