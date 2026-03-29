export type T_TimeUnit =
  | "milliseconds"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks";
class TimeConverter {
  private valueInSeconds: number;

  constructor(value: number, unit: T_TimeUnit) {
    this.valueInSeconds = convertToSeconds(value, unit);
  }

  static from(value: number, unit: T_TimeUnit): TimeConverter {
    return new TimeConverter(value, unit);
  }

  toSeconds(): number {
    return this.valueInSeconds;
  }

  toMinutes(): number {
    return this.valueInSeconds / 60;
  }

  toHours(): number {
    return this.valueInSeconds / 3600;
  }

  toDays(): number {
    return this.valueInSeconds / 86400;
  }

  add(value: number, unit: T_TimeUnit): TimeConverter {
    this.valueInSeconds += convertToSeconds(value, unit);
    return this;
  }

  subtract(value: number, unit: T_TimeUnit): TimeConverter {
    this.valueInSeconds -= convertToSeconds(value, unit);
    return this;
  }
}

// Helper function (same as enhanced version)
export function convertToSeconds(value: number, unit: T_TimeUnit): number {
  const conversionRates: Record<T_TimeUnit, number> = {
    milliseconds: 1 / 1000,
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
    weeks: 604800,
  };

  return value * conversionRates[unit];
}

export default TimeConverter;
