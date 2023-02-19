import { UserProfileRun } from 'therungg';
import {
  ClientWrapper,
  CommandProperties,
} from '../services/command-dispatch.service';
import Speedrunbuddy from '../speedrunbuddy';
import ICommand from './ICommand';
import { TheRunService, UtilityService } from '../services';

export default class AttemptsCommand implements ICommand {
  public name = 'attempts';
  public alias = 'totalattempts';

  public async execute(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const channel = wrapper.channel;

    const run: UserProfileRun | undefined = await TheRunService.negotiateRun(
      wrapper,
      properties
    );

    if (!run) return;

    const category = UtilityService.splitHash(run.displayRun);
    const game = run.game;
    const attemptCount = run.attemptCount;
    const finishedAttempts = run.finishedAttemptCount;

    const msgPartOne = `${
      channel.displayName
    } has ${attemptCount.toLocaleString()} attempts in ${game} ${category}.`;
    const msgPartTwo =
      finishedAttempts > 0
        ? `They have finished ${finishedAttempts.toLocaleString()} runs, or ${
            Math.round((finishedAttempts / attemptCount) * 100 * 10) / 10
          }% of all attempts.`
        : 'They have not finished any attempts (yet!).';

    Speedrunbuddy.client.say(
      channel.ircChannelName,
      `${msgPartOne} ${msgPartTwo}`
    );
  }
}
