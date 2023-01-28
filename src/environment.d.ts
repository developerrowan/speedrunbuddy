declare namespace NodeJS {
  interface ProcessEnv {
    TWITCH_USERNAME: string;
    TWITCH_BEARER_TOKEN: string;
    TWITCH_OAUTH_TOKEN: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    POSTGRESQL_DB_HOST: string;
    POSTGRESQL_DB_USERNAME: string;
    POSTGRESQL_DB_DATABASE: string;
    POSTGRESQL_DB_PASSWORD: string;
    POSTGRESQL_DB_PORT: string;
  }
}
