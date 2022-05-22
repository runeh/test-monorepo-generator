import { invariant } from 'ts-invariant';
import random, { Random } from 'random';
import seedRandom from 'seedrandom';
import { join } from 'path';
import makeDir from 'make-dir';
import { writeFile } from 'fs/promises';
import { format } from 'prettier';
import {
  fakeBuildScript,
  gitIgnore,
  nxConfig,
  repoPackageJson,
  rootReadme,
  turboConfig,
} from './templates';
import { BuildTime, Options, Package } from './types';

export { BuildTime, Options, Package };

function getPackageName(opts: {
  level: number;
  maxLevel: number;
  index: number;
}) {
  const { index, level, maxLevel } = opts;
  const paddedIndex = (index + 1).toString().padStart(2, '0');
  const paddedLevel = level + 1;
  if (level === maxLevel) {
    return `app-${paddedIndex}`;
  } else if (level === 0) {
    return `lib-${paddedLevel}_${paddedIndex}`;
  } else if (level === 1) {
    return `helper-lib-${paddedLevel}_${paddedIndex}`;
  } else if (level === 2) {
    return `compound-lib-${paddedLevel}_${paddedIndex}`;
  } else {
    return `super-lib-${paddedLevel}_${paddedIndex}`;
  }
}

function getBuildTime(rng: Random, pkg: Package) {
  const buildTimeRange: [number, number] =
    pkg.buildTime == null
      ? [0, 0]
      : typeof pkg.buildTime === 'number'
      ? [pkg.buildTime, pkg.buildTime]
      : pkg.buildTime;

  const buildTime = rng.int(buildTimeRange[0] * 1000, buildTimeRange[1] * 1000);
  return buildTime;
}

async function createRepoDir(options: Options) {
  const { destination, withNx, withTurbo } = options;
  const pkgJson = repoPackageJson(options);

  await makeDir(destination);
  await writeFile(
    join(destination, 'fake-build.js'),
    format(fakeBuildScript, { filepath: 'foo.js' }),
  );

  await writeFile(
    join(destination, 'package.json'),
    format(JSON.stringify(pkgJson), { filepath: 'foo.json' }),
  );
  await writeFile(
    join(destination, 'README.md'),
    format(rootReadme(options.packageCount), { filepath: 'foo.md' }),
  );

  await writeFile(join(destination, '.gitignore'), gitIgnore);

  if (withNx) {
    await writeFile(
      join(destination, 'nx.json'),
      format(JSON.stringify(nxConfig), { parser: 'json' }),
    );
  }

  if (withTurbo) {
    await writeFile(
      join(destination, 'turbo.json'),
      format(JSON.stringify(turboConfig), { parser: 'json' }),
    );
  }
}

async function createWorkspaceDir(
  rng: Random,
  root: string,
  pkg: Package,
  versionKind: 'yarn1' | 'yarn2' = 'yarn1',
) {
  const pth = join(root, 'packages', pkg.name);
  const buildTime = getBuildTime(rng, pkg);

  await makeDir(pth);
  await makeDir(join(pth, 'dist'));
  await writeFile(
    join(pth, 'package.json'),
    format(
      JSON.stringify({
        name: pkg.name,
        private: true,
        version: '1.0.0',
        scripts: {
          build: `node ../../fake-build.js ${buildTime}`,
          test: 'node ../../fake-build.js',
          lint: 'node ../../fake-build.js',
        },
        dependencies: Object.fromEntries(
          pkg.dependencies.map((e) => {
            const version = versionKind === 'yarn1' ? '1.0.0' : 'workspace:*';
            return [e, version];
          }),
        ),
      }),
      { filepath: 'package.json' },
    ),
  );

  await makeDir(join(pth, 'src'));
}

// Hov many of the packages are apps and how many are libraries.
// 1/4 means one in four of the packages is an app.
const depLevelRatio = 1 / 4;

interface GenerateOpts {
  rng: Random;
  packageCount: number;
  packageLevels: number;
  buildTime?: BuildTime;
  useTurbo?: boolean;
}

function randomIndexes(opts: {
  rng: Random;
  min: number;
  max: number;
  count: number;
}): number[] {
  const { count, max, min, rng } = opts;
  // fixme: invariant for neverending loop
  const ret: number[] = [];

  while (ret.length < count) {
    const candidate = rng.int(min, max);
    if (!ret.includes(candidate)) {
      ret.push(candidate);
    }
  }

  return ret.sort();
}

function reverseRange(length: number): number[] {
  return Array.from({ length })
    .map((_, index) => index)
    .reverse();
}

function generateDependencyTree(opts: GenerateOpts) {
  const { packageCount, rng, packageLevels, buildTime } = opts;
  invariant(packageCount > 2, 'Package count must be greater than 2');

  const packages = [];

  let packageSlots = packageCount;
  for (const level of reverseRange(packageLevels)) {
    const count =
      level === 0 ? packageSlots : Math.ceil(packageSlots * depLevelRatio);
    const generated = generateLevelPackages({
      rng,
      level,
      count,
      buildTime,
      maxLevel: packageLevels - 1,
    });
    packages.push(...generated);
    packageSlots = packageSlots - count;
  }

  // Assign dependencies. All dependencies should be on a level lower than
  // the package's own level.
  for (const pkg of packages.filter((e) => e.level > 0)) {
    const possibleDeps = packages.filter((e) => e.level < pkg.level);
    const wantedDepCount = rng.integer(
      1,
      Math.max(Math.ceil(possibleDeps.length * 0.5), 4),
    );
    const depIndexes = randomIndexes({
      count: wantedDepCount,
      min: 0,
      max: possibleDeps.length - 1,
      rng,
    });

    depIndexes.forEach((e) => pkg.dependencies.push(possibleDeps[e].name));
  }

  return packages;
}

function generateLevelPackages(opts: {
  rng: Random;
  level: number;
  count: number;
  maxLevel: number;
  buildTime?: BuildTime;
}) {
  const { buildTime, count, level, maxLevel } = opts;
  const deps = Array.from({ length: count }).map<Package>((_, index) => {
    return {
      level: level,
      name: getPackageName({ index, level, maxLevel }),
      dependencies: [],
      buildTime,
    };
  });
  return deps;
}

export async function createTestRepo(options: Options): Promise<void> {
  const { destination } = options;
  const packageCount = options.packageCount ?? 32;
  const packageLevels = options.packageLevels ?? 3;
  const seed = options.seed ?? Math.random().toString();
  const buildTime = options.buildTime ?? 0;
  const rng = random.clone(seedRandom(seed));

  await createRepoDir(options);
  const pkgs = generateDependencyTree({
    rng,
    packageCount,
    packageLevels,
    buildTime,
  });
  await Promise.all(pkgs.map((e) => createWorkspaceDir(rng, destination, e)));
}
