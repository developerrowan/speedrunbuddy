export default abstract class UtilityService {
  public static formatMilliseconds(milliseconds: number) {
    const pad = (n: number, z?: number) => {
      z = z || 2;
      return ('00' + n).slice(-z);
    };

    const ms = milliseconds % 1000;
    milliseconds = (milliseconds - ms) / 1000;
    const secs = milliseconds % 60;
    milliseconds = (milliseconds - secs) / 60;
    const mins = milliseconds % 60;
    const hrs = (milliseconds - mins) / 60;

    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
  }

  public static getDaysBetween(startDate: string, endDate: string): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (
      (UtilityService.dateToUTC(endDate).getTime() -
        UtilityService.dateToUTC(startDate).getTime()) /
      millisecondsPerDay
    );
  }

  public static dateToUTC(date: string): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
  }

  public static splitHash(str: string): string {
    return str.split('#')[1];
  }
}
