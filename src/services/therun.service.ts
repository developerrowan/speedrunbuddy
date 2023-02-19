import fuzzysort from 'fuzzysort';
import { CommandProperties, ClientWrapper } from './command-dispatch.service';
import {
  getLiveRun,
  getUserProfile,
  LiveRun,
  UserProfile,
  UserProfileRun,
} from 'therungg';
import { TwitchChannelInfo } from './channel.service';
import * as constants from '../constants';
import { ChannelService, UtilityService } from '../services';
import Speedrunbuddy from '../speedrunbuddy';

export default abstract class TheRunService {
  public static async negotiateRun(
    wrapper: ClientWrapper,
    properties: CommandProperties
  ): Promise<UserProfileRun | undefined> {
    const client = Speedrunbuddy.client;
    const channel = wrapper.channel;

    channel.channelName = 'zeas44';
    channel.displayName = 'Zeas44';

    let theRunProfile: UserProfile;
    try {
      theRunProfile = await getUserProfile(channel.displayName);
    } catch (e: unknown) {
      console.log(e);
      Speedrunbuddy.client.say(
        channel.ircChannelName,
        constants.SOMETHING_WENT_WRONG_MSG
      );
      return undefined;
    }

    const runs: UserProfileRun[] = theRunProfile.runs;

    if (runs.length === 0) {
      client.say(
        channel.ircChannelName,
        "I couldn't find any runs for this channel. Are you using TheRun?"
      );
      return undefined;
    }

    const channelInfo: TwitchChannelInfo = {
      game: '',
      title: '',
    };

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
      const compare = fuzzysort.go(properties.argument, runs, {
        key: 'displayRun',
      });

      if (compare && compare[0]?.obj) {
        return compare[0].obj;
      }

      client.say(
        channel.ircChannelName,
        `I couldn't find any results for "${properties.argument}".`
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
}
