import { RunHistory, UserProfileRun, getHistory } from 'therungg';
import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { TheRunService, UtilityService } from '../services';

export default class PbsCommand implements ICommand {
  public name = 'pbs';
  public alias = 'personalbests';

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const displayName = wrapper.channel.displayName;

    const run: UserProfileRun | undefined = await TheRunService.negotiateRun(
      wrapper,
      properties
    );

    if (!run) return;

    const historyFile: RunHistory = await getHistory(run.historyFilename);

    let best: number = Number.MAX_SAFE_INTEGER;
    let pbs = 0;

    for (let i = 0; i < historyFile.sessions.length; i++) {
      const finishedRuns: string[] = historyFile.sessions[i].finishedRuns;

      if (finishedRuns.length === 0) continue;

      for (let j = 0; j < finishedRuns.length; j++) {
        const time = parseInt(finishedRuns[j]);

        if (time < best) {
          best = time;
          pbs++;
        }
      }
    }

    const hasPb: boolean = pbs > 0;

    Speedrunbuddy.client.say(
      wrapper.channel.ircChannelName,
      `${
        hasPb
          ? `${displayName} has ${pbs} distinct PBs in ${
              run.game
            } ${UtilityService.splitHash(run.displayRun)}!`
          : ''
      } Check out all of ${
        hasPb ? 'their' : `${displayName}'s`
      } runs and PBs at https://therun.gg/${encodeURI(decodeURI(run.url))}!`
    );
  }
}
