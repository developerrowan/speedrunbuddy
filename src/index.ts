import 'dotenv/config';
import Speedrunbuddy from './speedrunbuddy';
import {
  ChannelService,
  CommandDispatchService,
  TheRunService,
} from './services';

CommandDispatchService.registerAll([
  {
    commandName: 'speedrunbuddy',
    listenInBotChat: true,
    commandAction: ChannelService.helpCommand,
  },
  {
    commandName: 'join',
    botChatOnly: true,
    commandAction: ChannelService.joinCommand,
  },
  {
    commandName: 'leave',
    botChatOnly: true,
    commandAction: ChannelService.leaveCommand,
  },
  {
    commandName: 'pb',
    commandAlias: 'personalbest',
    commandAction: TheRunService.pbCommand,
  },
  {
    commandName: 'pbs',
    commandAlias: 'personalbests',
    commandAction: TheRunService.pbsCommand,
  },
  {
    commandName: 'attempts',
    commandAction: TheRunService.attemptsCommand,
  },
  {
    commandName: 'playtime',
    commandAction: TheRunService.playtimeCommand,
  },
]);

Speedrunbuddy.start();
