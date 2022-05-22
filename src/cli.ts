import { program, InvalidArgumentError, Option } from 'commander';
import { createTestRepo } from './index';
import { BuildTime } from './types';

function parseNumber(thing: string): number {
  const parsed = Number.parseInt(thing, 10);
  if (typeof parsed === 'number' && !Number.isNaN(parsed)) {
    return parsed;
  } else {
    throw new InvalidArgumentError('Not a number');
  }
}

function parseTimeRange(thing: string): BuildTime {
  const rangeMatch = thing.match(/^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
  const digitMatch = thing.match(/^(\d+(?:\.\d+)?)$/);

  if (rangeMatch) {
    return [Number(rangeMatch[1]), Number(rangeMatch[2])];
  } else if (digitMatch) {
    const num = Number(digitMatch[1]);
    return [num, num];
  } else {
    throw new InvalidArgumentError('Not a number or number range');
  }
}

program
  .name('test-monorepo-generator')
  .description('Create test monorepo')
  .version('1.0.0-beta1')
  .argument('destination', 'output dir')
  .option(
    '-p, --packages <number>',
    'The number of workspaces to generate in the repo',
    parseNumber,
    32,
  )
  .option(
    '-l, --levels <string>',
    'The max possible depth of dependencies',
    parseNumber,
    3,
  )
  .addOption(
    new Option(
      '-s, --seed <string>',
      'Seed for the pseudorandom generator',
    ).default(null, 'a random seed'),
  )
  .addOption(
    new Option(
      '-d, --delay <delay>',
      'Add a delay to the build commands of the workspaces',
    )
      .default(null, 'no delay')
      .argParser(parseTimeRange),
  )
  .option('-t, --with-turbo', 'Add turborepo config file', false)
  .option('-n, --with-nx', 'add nx config file', false);

async function main() {
  program.parse();
  const options = program.opts<{
    packages: number;
    levels: number;
    seed: string | undefined;
    delay: BuildTime | undefined;
    withTurbo: boolean;
    withNx: boolean;
  }>();
  const [destination] = program.args;

  await createTestRepo({
    destination,
    packageCount: options.packages,
    packageLevels: options.levels,
    buildTime: !options.delay ? undefined : options.delay,
    seed:
      typeof options.seed === 'string' ? options.seed : String(Math.random()),
    withTurbo: options.withTurbo,
    withNx: options.withNx,
  });
}

main();
