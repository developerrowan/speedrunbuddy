import { UserProfileRun } from 'therungg';
import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { TheRunService, UtilityService } from '../services';
import { Channel } from '../services/channel.service';

export default class PlaytimeCommand implements ICommand {
  public name = 'playtime';
  public alias = 'runtime';

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
    const timeInMilliseconds: number = parseInt(run.totalRunTime);

    Speedrunbuddy.client.say(
      channel.ircChannelName,
      `${
        channel.displayName
      } has spent ${UtilityService.millisecondsToDaysHourMinutes(
        timeInMilliseconds
      )} running ${game} ${category} (and that's not including practice!).`
    );
  }
}
