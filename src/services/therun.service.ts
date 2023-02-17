import fuzzysort from 'fuzzysort';
import { CommandProperties, ClientWrapper } from './command-dispatch.service';
import {
  getLiveRun,
  getUserProfile,
  LiveRun,
  UserProfile,
  UserProfileRun,
} from 'therungg';
import { Channel, TwitchChannelInfo } from './channel.service';
import * as constants from '../constants';
import { DecoratedClient } from '@twurple/auth-tmi/lib/client';
import { ChannelService, UtilityService } from '../services';
import Speedrunbuddy from '../speedrunbuddy';

export default abstract class TheRunService {
  public static pbsCommand(wrapper: ClientWrapper, _: CommandProperties): void {
    const displayName = wrapper.channel.displayName;

    Speedrunbuddy.client.say(
      wrapper.channel.ircChannelName,
      `Check out all of ${displayName}'s runs and PBs at https://therun.gg/${displayName}!`
    );
  }

  private static async negotiateRun(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<UserProfileRun | undefined> {
    const client = Speedrunbuddy.client;
    const channel = wrapper.channel;

    let theRunProfile: UserProfile;
    try {
      theRunProfile = await getUserProfile(channel.displayName);
    } catch (e: unknown) {
      console.log(e);
      return undefined;
    }

    const runs: UserProfileRun[] = theRunProfile.runs;

    const channelInfo: TwitchChannelInfo = {
      game: '',
      title: '',
    };

    if (runs.length === 0) {
      client.say(
        channel.ircChannelName,
        "I couldn't find any runs for this channel. Are you using TheRun?"
      );
      return undefined;
    }

    if (properties.quotedArgument) {
      const compare = fuzzysort.go(properties.quotedArgument, runs, {
        key: 'game',
      });

      if (compare && compare[0]) {
        channelInfo.game = compare[0].obj.game;
      } else {
        client.say(
          channel.ircChannelName,
          `It doesn't look like ${channel.displayName} has any runs for ${properties.quotedArgument}.`
        );
        return undefined;
      }
    }

    // Searches the Live HTTP API first
    const liveRun: LiveRun = await getLiveRun(channel.displayName);

    if (
      liveRun.game &&
      liveRun.category &&
      !(properties.quotedArgument || properties.argument)
    ) {
      const matchedRun = theRunProfile.runs.find(
        run =>
          run.game === liveRun.game &&
          UtilityService.splitHash(run.displayRun) === liveRun.category
      );

      if (matchedRun) return matchedRun;
    }

    // Saves a precious Twitch API call if a fully-formed command is provided
    if (!(properties.quotedArgument && properties.argument)) {
      const fetchChannelInfo = await ChannelService.getTwitchChannelInfo(
        channel.channelName
      );

      if (!fetchChannelInfo) {
        client.say(channel.ircChannelName, constants.SOMETHING_WENT_WRONG_MSG);
        return undefined;
      }

      channelInfo.title = fetchChannelInfo.title;

      if (!properties.quotedArgument) {
        channelInfo.game = fetchChannelInfo.game;
      }
    }

    if (properties.argument) {
      const compare = fuzzysort.go(
        `${channelInfo.game}#${properties.argument.toLowerCase()}`,
        runs,
        { key: 'displayRun' }
      );

      if (compare && compare[0]) {
        const found = runs.find(
          (run: UserProfileRun) => run.displayRun === compare[0].target
        );

        if (found) return found;
      }

      client.say(
        channel.ircChannelName,
        `I couldn't find any runs for the category "${properties.argument}" in ${channelInfo.game}.`
      );
    } else {
      const hasPbInGame = runs.find(
        (run: UserProfileRun) => run.game === channelInfo.game
      );

      if (!hasPbInGame) {
        client.say(
          channel.ircChannelName,
          `I couldn't find a PB for ${channelInfo.game}. Has a run been uploaded for it?`
        );
        return undefined;
      }

      // Search inside stream title for category
      if (channelInfo.title) {
        const title = channelInfo.title.toLowerCase();

        for (let i = 0; i < runs.length; i++) {
          const run: UserProfileRun = runs[i];

          if (
            run.game === channelInfo.game &&
            title.includes(
              UtilityService.splitHash(run.displayRun).toLowerCase()
            )
          ) {
            return run;
          }
        }
      }

      // Try to find an any% category from The Run
      const anyPercentCategory = runs.find(
        (run: UserProfileRun) =>
          run.game === channelInfo.game &&
          UtilityService.splitHash(run.displayRun).toLowerCase() === 'any%'
      );

      if (anyPercentCategory) return anyPercentCategory;

      // Give up. Return the first found category
      return hasPbInGame;
    }
  }

  public static async pbCommand(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const client = Speedrunbuddy.client;
    const channel = wrapper.channel;

    const run: UserProfileRun | undefined = await TheRunService.negotiateRun(
      wrapper,
      properties
    );

    if (run) TheRunService.reportPbToChannel(client, channel, run);
  }

  public static async attemptsCommand(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<void> {
    const client = Speedrunbuddy.client;
    const channel = wrapper.channel;

    const run: UserProfileRun | undefined = await TheRunService.negotiateRun(
      wrapper,
      properties
    );

    if (run) TheRunService.reportAttempts(client, channel, run);
  }

  public static reportAttempts(
    client: DecoratedClient,
    channel: Channel,
    run: UserProfileRun
  ): void {
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

    client.say(channel.ircChannelName, `${msgPartOne} ${msgPartTwo}`);
  }

  public static reportPbToChannel(
    client: DecoratedClient,
    channel: Channel,
    run: UserProfileRun
  ): void {
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
