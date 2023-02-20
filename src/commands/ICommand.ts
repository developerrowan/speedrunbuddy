import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';

export default interface ICommand {
  name: string;
  alias?: string;
  regex?: RegExp;
  customNameFromDatabase?: string;
  listenInBotChat?: boolean;
  botChatOnly?: boolean;

  execute(wrapper: ClientWrapper, properties: CommandProperties): Promise<void>;
}
