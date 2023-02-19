import { UserProfileRun } from 'therungg';
import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { TheRunService, UtilityService } from '../services';

export default class PbCommand implements ICommand {
  public name = 'pb';
  public alias = 'personalbest';

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const client = Speedrunbuddy.client;
    const channel = wrapper.channel;

    const run: UserProfileRun | undefined = await TheRunService.negotiateRun(
      wrapper,
      properties
    );

    if (!run) return;
    const category = UtilityService.splitHash(run.displayRun);

    if (
      !run.personalBestTime ||
      (run.personalBestTime.length === 0 && !run.hasGameTime)
    ) {
      client.say(
        channel.ircChannelName,
        `I couldn't find a PB for ${run.game} in the ${category} category. Has a run been completed?`
      );
      return;
    }

    const igt: boolean = run.hasGameTime && run.gameTimeData !== null;

    const milliseconds = parseInt(
      igt && run.gameTimeData ? run.gameTimeData.personalBest : run.personalBest
    );

    const daysAgo = run.personalBestTime
      ? Math.floor(
          UtilityService.getDaysBetween(
            run.personalBestTime,
            new Date().toUTCString()
          )
        )
      : -1;

    const daysAgoString = `It was achieved ${
      daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : 'today'
    }.`;

    const splitURL = run.url.split('/');

    const encodedURL = `https://therun.gg/${splitURL[0]}/${
      splitURL[1]
    }/${encodeURIComponent(splitURL[2])}`;

    client.say(
      channel.ircChannelName,
      `${channel.displayName}'s PB in ${
        run.game
      } in the ${category} category is ${UtilityService.formatMilliseconds(
        milliseconds
      )}${igt ? ' (IGT)' : ''}! ${
        daysAgo !== -1 ? daysAgoString : ''
      } ${encodedURL}`
    );
  }
}
