export type BuildTime = number | [min: number, max: number];

export interface Package {
  level: number;
  name: string;
  dependencies: string[];
  buildTime?: BuildTime;
}

export interface Options {
  destination: string;
  seed: string;
  packageCount?: number;
  packageLevels?: number;
  buildTime?: BuildTime;
  withTurbo?: boolean;
  withNx?: boolean;
}
