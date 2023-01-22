/* @eslint-ignore no-empty */

import 'dotenv/config';
import * as tmi from '@twurple/auth-tmi';
import { RefreshingAuthProvider } from '@twurple/auth';
import pg from 'pg';
import { UserProfileRun, getUserProfile } from 'therungg';
import { DecoratedClient } from '@twurple/auth-tmi/lib/client';
import fuzzysort from 'fuzzysort';

const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:(?:[^\w"“]+)?(?:“|")([^"“”]+)(?:”|")?(?:\W+)?)?(.*)?/);

const SOMETHING_WENT_WRONG_MSG = 'Sorry, something went wrong. :( If this keeps happening, contact my creator!';

const INTRODUCTORY_MSG = `Hi! I'm speedrunbuddy! I'm here to help you find your favourite streamer's PBs using just simple commands! 
    Learn more about me and what I can do at https://github.com/developerrowan/speedrunbuddy`;

const pool = new pg.Pool({
    user: process.env.POSTGRESQL_DB_USERNAME,
    database: process.env.POSTGRESQL_DB_DATABASE,
    password: process.env.POSTGRESQL_DB_PASSWORD,
    port: +process.env.POSTGRESQL_DB_PORT || 5432,
    host: process.env.POSTGRESQL_DB_HOST
});

const getChannelsToJoin = async () => {
    const rows = await pool.query(
        'SELECT username FROM channels'
    ).then(res => res.rows);

    const channelsList: string[] = [];

    rows.map(row => channelsList.push(row.username));

    return channelsList;
};

type ChannelInfo = {
    game: string;
    title: string;
};

(async () => {

    const authInfo = await pool.query(
        'SELECT * FROM auth'
    );

    const authProvider = new RefreshingAuthProvider(
        {
            clientId: process.env.TWITCH_CLIENT_ID,
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
            onRefresh: async newTokenData => await pool.query(
                'UPDATE auth SET accessToken = $1, refreshToken = $2, expiresIn = $3, obtainmentTimestamp = $4',
                [newTokenData.accessToken, newTokenData.refreshToken, newTokenData.expiresIn, newTokenData.obtainmentTimestamp]
            )
        },
        {
            accessToken: authInfo.rows[0].accesstoken,
            refreshToken: authInfo.rows[0].refreshtoken,
            expiresIn: +authInfo.rows[0].expiresin,
            obtainmentTimestamp: +authInfo.rows[0].obtainmenttimestamp,
            scope: ["chat:edit", "chat:read"]
        }
    );

    const client = new tmi.Client({
        authProvider,
        connection: {
            reconnect: true,
            secure: true,
        },
        channels: await getChannelsToJoin()
    });

    client.connect().catch(console.error);

    client.on('message', async (channel: string, userstate: tmi.ChatUserstate, message: string, self: boolean) => {
        if (self || userstate['message-type'] != 'chat') return;

        if (regexpCommand.test(message)) {
            let [_, command, specifiedGame, argument] = message.match(regexpCommand)!;

            const commander = userstate.username!;
            const niceChannelName = splitUsername(channel);

            let displayName: string | undefined;
            let channelInfo: ChannelInfo | undefined;

            await setLastUsed(splitUsername(channel));

            // Hacky fix for leaving a channel when part doesn't immediately work.
            if (!await channelExists(niceChannelName)) return;

            switch (command) {
                case 'speedrunbuddy':
                    if (niceChannelName === client.getUsername()) break;

                    client.say(channel, INTRODUCTORY_MSG);
                    break;
                case 'join':
                    if (niceChannelName !== client.getUsername()) break;

                    if (await channelExists(commander)) {
                        client.say(channel, 'Thanks for inviting me over, but I\'m actually already in your chat!')
                    } else {
                        try {
                            await client.join(commander);
                        } catch (e: unknown) {
                            client.say(channel, SOMETHING_WENT_WRONG_MSG);
                            return;
                        }

                        const addedChannelToDatabase = await addChannel(commander);

                        if (addedChannelToDatabase) {
                            client.say(channel, 'Sweet, I\'ve joined your chat! Thanks for inviting me!');
                            client.say(`#${commander}`, INTRODUCTORY_MSG);
                        } else {
                            client.say(channel, SOMETHING_WENT_WRONG_MSG);
                        }
                    }
                    break;
                case 'leave':
                    if (niceChannelName !== client.getUsername()) break;

                    if (await channelExists(commander)) {
                        const result = await removeChannel(commander, client);

                        if (result) {
                            client.say(channel, 'I\'m sorry to go, but I hope I can return soon! I\'ve left your channel, and I won\'t attempt to rejoin it unless you tell me to.');
                        } else {
                            client.say(channel, SOMETHING_WENT_WRONG_MSG);
                        }
                    } else {
                        client.say(channel, 'I\'m not in your chat, so I can\'t leave!');
                    }
                    break;
                case 'pbs':
                    if (niceChannelName === client.getUsername()) break;

                    channelInfo = await getChannelInfo(niceChannelName);

                    if (channelInfo) {
                        displayName = await getDisplayName(niceChannelName);

                        client.say(channel, `Check out all of ${displayName}'s runs and PBs at https://therun.gg/${displayName}!`);
                    }
                    break;
                case 'personalbest':
                case 'pb':
                    if (niceChannelName === client.getUsername()) break;

                    channelInfo = {
                        game: '',
                        title: ''
                    };

                    displayName = await getDisplayName(niceChannelName);

                    const theRunProfile = await getUserProfile(displayName);

                    const runs: UserProfileRun[] = theRunProfile.runs;

                    if (runs.length === 0) {
                        client.say(channel, 'I couldn\'t find any runs for this channel. Are you using TheRun?');
                        return;
                    }

                    // Check for a game name being passed in double quotes
                    if (specifiedGame) {
                        const compare = fuzzysort.go(specifiedGame, runs, { key: 'game' });

                        if (compare && compare[0]) {
                            channelInfo.game = compare[0].obj.game;
                        } else {
                            client.say(channel, `It doesn't look like ${displayName} has any runs for ${specifiedGame}.`);
                            return;
                        }
                    }

                    // TODO: Search Live API first

                    const fetchChannelInfo = await getChannelInfo(niceChannelName);

                    if (fetchChannelInfo) {
                        channelInfo.title = fetchChannelInfo.title;

                        if (!specifiedGame) {
                            channelInfo.game = fetchChannelInfo.game;
                        }

                        if (argument) {
                            argument = argument.trim();

                            const compare = fuzzysort.go(`${channelInfo.game}#${argument.toLowerCase()}`, runs, { key: 'displayRun' });

                            if (compare && compare[0]) {
                                const found = runs.find((run: UserProfileRun) => run.displayRun === compare[0].target);

                                if (found) {
                                    reportPb(client, channel, displayName, channelInfo, found);
                                    return;
                                }
                            }

                            client.say(channel, `I couldn't find any runs for the category "${argument}" in ${channelInfo.game}.`);
                        } else {

                            const hasPbInGame = runs.find((run: UserProfileRun) => run.game === channelInfo?.game);

                            if (!hasPbInGame) {
                                client.say(channel, `I couldn't find a PB for ${channelInfo.game}. Has a run been uploaded for it?`);
                                return;
                            }

                            // First, try to see if the stream title contains a known category
                            const title = channelInfo?.title.toLowerCase();

                            runs.forEach((run: UserProfileRun) => {
                                if (run.game === channelInfo?.game && title?.includes(splitUsername(run.displayRun).toLowerCase())) {
                                    reportPb(client, channel, displayName, channelInfo, run);
                                    return;
                                }
                            });

                            // Fallback to trying to find any%
                            const anyPercentCategory = runs.find((run: UserProfileRun) => run.game === channelInfo?.game && splitUsername(run.displayRun).toLowerCase() === 'any%')

                            if (anyPercentCategory) {
                                reportPb(client, channel, displayName, channelInfo, anyPercentCategory);
                                return;
                            }

                            // Give up. Return the first found category
                            reportPb(client, channel, displayName, channelInfo, hasPbInGame);
                        }
                    } else {
                        client.say(channel, SOMETHING_WENT_WRONG_MSG);
                    }
                    break;
            }
        }
    });
})();

const getAccessToken = async () => pool.query('SELECT accessToken FROM auth').then(result => result.rows[0].accesstoken);

const reportPb = (client: DecoratedClient, channel: string, displayName: string | undefined, channelInfo: ChannelInfo, run: UserProfileRun) => {

    const category = splitUsername(run.displayRun);

    if (!run.personalBestTime || run.personalBestTime.length === 0 && !run.hasGameTime) {
        client.say(channel, `I couldn't find a PB for ${channelInfo.game} in the ${category} category. Has a run been completed?`);
        return;
    }

    const igt: boolean = run.hasGameTime && run.gameTimeData !== null;

    const milliseconds = parseInt(igt ? run.gameTimeData!.personalBest : run.personalBest);

    const daysAgo = run.personalBestTime ? Math.floor(daysBetween(run.personalBestTime, new Date().toUTCString())) : -1;

    const daysAgoString = `It was achieved ${daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : 'today'}.`;

    const splitURL = run.url.split('/');

    const encodedURL = `https://therun.gg/${splitURL[0]}/${splitURL[1]}/${encodeURIComponent(splitURL[2])}`;

    client.say(channel, `${displayName || splitUsername(channel)}'s PB in ${channelInfo.game} in the ${category} category is ${msToTime(milliseconds)}${igt
        ? ' (IGT)' : ''}! ${daysAgo !== -1 ? daysAgoString : ''} ${encodedURL}`);
};

const treatAsUTC = (date: string): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
};

const daysBetween = (startDate: string, endDate: string) => {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate).getTime() - treatAsUTC(startDate).getTime()) / millisecondsPerDay;
};

const msToTime = (s: number) => {
    const pad = (n: number, z?: number) => {
        z = z || 2;
        return ('00' + n).slice(-z);
    }

    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;

    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
};

const splitUsername = (username: string) => username.split('#')[1];

const channelExists = (username: string): Promise<boolean> => {
    return pool.query(
        'SELECT * FROM channels WHERE username = $1',
        [username]
    ).then(res => res.rowCount > 0);
};

const getDisplayName = (username: string): Promise<string> => {
    return pool.query(
        'SELECT * FROM channels WHERE username = $1',
        [username]
    ).then(res => res.rows[0].display_name);
};

const getChannelInfo = async (username: string): Promise<ChannelInfo | undefined> => {
    const channelId: string | undefined = await getUserId(username);

    if (!channelId) return undefined;

    return fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${channelId}`, { 'headers': { 'Authorization': `Bearer ${await getAccessToken()}`, 'Client-ID': process.env.TWITCH_CLIENT_ID } }).then(async response => {
        if (response.ok) {
            const twitch = await response.json();

            return {
                game: twitch.data[0].game_name,
                title: twitch.data[0].title
            } as ChannelInfo;
        }

        return undefined;
    });
};

const getUserId = async (username: string): Promise<string | undefined> => {
    return pool.query(
        'SELECT * FROM channels WHERE username = $1',
        [username]
    ).then(res => res.rowCount === 1 ? res.rows[0].user_id : undefined);
};

const setLastUsed = async (username: string): Promise<void> => {
    pool.query(
        'UPDATE channels SET last_use_date = $1 WHERE username = $2',
        [new Date(), username]
    );
};

const addChannel = async (username: string): Promise<boolean> => {
    return fetch(`https://api.twitch.tv/helix/users?login=${username}`, { 'headers': { 'Authorization': `Bearer ${await getAccessToken()}`, 'Client-ID': process.env.TWITCH_CLIENT_ID } }).then(async response => {
        if (response.ok) {
            const twitch = await response.json();

            if (username == twitch.data[0].login) {
                const result = await pool.query('INSERT INTO channels (username, display_name, user_id) VALUES ($1, $2, $3)',
                    [username, twitch.data[0].display_name, twitch.data[0].id])

                if (result.rowCount === 1) {
                    return true;
                }
            }
        }

        return false;
    });
};

const removeChannel = async (username: string, client: DecoratedClient): Promise<boolean> => {
    try {
        await client.part('username');
    } catch (e: unknown) {
        // This block can be empty due to an issue with part not working. This is handled above.
    }

    const removeResult = await pool.query('DELETE FROM channels WHERE username = $1', [username])

    if (removeResult.rowCount === 1) {
        return true;
    }

    return false;
};