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

  public static millisecondsToDaysHourMinutes(milliseconds: number) {
    const dayInMs = 24 * 60 * 60 * 1000;
    const hourInMs = 60 * 60 * 1000;

    let days = Math.floor(milliseconds / dayInMs);
    let hours = Math.floor((milliseconds - days * dayInMs) / hourInMs);
    let minutes = Math.round(
      (milliseconds - days * dayInMs - hours * hourInMs) / 60000
    );

    if (minutes === 60) {
      hours++;
      minutes = 0;
    }

    if (hours === 24) {
      days++;
      hours = 0;
    }

    let result = '';

    const d: boolean = days > 0;
    const h: boolean = hours > 0;
    const m: boolean = minutes > 0;

    if (days > 0) {
      let suffix = '';

      if (h && m) {
        suffix = ', ';
      } else if (h || m) {
        suffix = ' and ';
      }

      result += `${days} ${this.pluralise('day', days)}${suffix}`;
    }

    if (hours > 0) {
      let suffix = '';

      if (d && m) {
        suffix = ', and ';
      } else if (d || m) {
        suffix = ' and ';
      }

      result += `${hours} ${this.pluralise('hour', hours)}${suffix}`;
    }

    if (minutes > 0) {
      result += `${minutes} ${this.pluralise('minute', minutes)}`;
    }

    return result;
  }

  private static pluralise(str: string, n: number) {
    return n > 0 ? `${str}s` : str;
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
