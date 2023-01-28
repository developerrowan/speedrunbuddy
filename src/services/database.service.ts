import pg from 'pg';

export default abstract class DatabaseService {
  private static _pool: pg.Pool | undefined;

  public static get pool(): pg.Pool {
    if (!DatabaseService._pool) {
      DatabaseService._pool = new pg.Pool({
        user: process.env.POSTGRESQL_DB_USERNAME,
        database: process.env.POSTGRESQL_DB_DATABASE,
        password: process.env.POSTGRESQL_DB_PASSWORD,
        port: +process.env.POSTGRESQL_DB_PORT || 5432,
        host: process.env.POSTGRESQL_DB_HOST,
      });
    }

    return DatabaseService._pool;
  }
}
