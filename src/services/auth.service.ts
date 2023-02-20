import Constants from '../constants';
import DatabaseService from './database.service';
import { AccessToken } from '@twurple/auth/lib';

export type AuthInfo = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainmentTimestamp: number;
  scope: string[];
};

export default abstract class AuthService {
  public static getAuthInfo(): Promise<AuthInfo> {
    return DatabaseService.pool.query('SELECT * FROM auth').then(result => {
      return {
        accessToken: result.rows[0].accesstoken,
        refreshToken: result.rows[0].refreshtoken,
        expiresIn: +result.rows[0].expiresin,
        obtainmentTimestamp: +result.rows[0].obtainmenttimestamp,
        scope: Constants.AUTH_SCOPE,
      } as AuthInfo;
    });
  }

  public static get accessToken(): Promise<string> {
    return this.getAuthInfo().then(authInfo => authInfo.accessToken);
  }

  public static refreshAccessToken(accessToken: AccessToken): Promise<void> {
    return DatabaseService.pool
      .query(
        'UPDATE auth SET accessToken = $1, refreshToken = $2, expiresIn = $3, obtainmentTimestamp = $4',
        [
          accessToken.accessToken,
          accessToken.refreshToken,
          accessToken.expiresIn,
          accessToken.obtainmentTimestamp,
        ]
      )
      .then(() => {
        return;
      });
  }
}
