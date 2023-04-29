import { RunHistory, UserProfileRun, getHistory } from 'therungg';
import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { TheRunService, UtilityService } from '../services';
import { Channel } from '../services/channel.service';

export default class AveragetimeCommand implements ICommand {
  public name = 'averagetime';
  public alias = 'average';

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const channel: Channel = wrapper.channel;

    const run: UserProfileRun | undefined = await TheRunService.negotiateRun(
      wrapper,
      properties
    );

    if (!run) return;

    const game: string = run.game;
    const category: string = UtilityService.splitHash(run.displayRun);

    const historyFilename: string = run.historyFilename;
    const historyFile: RunHistory = await getHistory(historyFilename);

    const averageTime: number =
      +historyFile.meta.totalRunTime / historyFile.runs.length;

    Speedrunbuddy.client.say(
      channel.ircChannelName,
      `${
        channel.displayName
      }'s average time in ${game} ${category} is ${UtilityService.formatMilliseconds(
        averageTime
      )}.`
    );
  }
}
