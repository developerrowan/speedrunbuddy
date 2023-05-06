import { RunHistory, UserProfileRun, getHistory } from 'therungg';
import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { TheRunService, UtilityService } from '../services';
import { Channel } from '../services/channel.service';

export default class HowManyIntrosCommand implements ICommand {
  public name = 'howmanyintros';
  public alias = 'hmi';

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const channel: Channel = wrapper.channel;

    const run: UserProfileRun | undefined = await TheRunService.negotiateRun(
      wrapper,
      properties
    );

    if (!run || !run.game.includes('Super Mario 64')) return;

    const category: string = UtilityService.splitHash(run.displayRun);

    const introTime = 55000;
    let totalIntroWatched = 0;

    const history: RunHistory = await getHistory(run.historyFilename);

    for (let i = 0; i < history.runs.length; i++) {
      const time: number = +history.runs[i].duration;

      totalIntroWatched += time >= introTime ? introTime : time;
    }

    Speedrunbuddy.client.say(
      channel.ircChannelName,
      `${
        channel.displayName
      } has spent ${UtilityService.millisecondsToDaysHourMinutes(
        totalIntroWatched
      )} watching the intro while running ${category} (calculated assuming intro is exactly 55 seconds long).`
    );
  }
}
