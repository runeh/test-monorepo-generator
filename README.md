# test-monorepo-generator

`test-monorepo-generator` creates monorepos with workspaces that depend on each
other. This can be useful for testing tools that work on monorepos. See the
`example` folder for an example.

The package can be used as a CLI tool, or called programmatically.

## Command line

```console
Usage: test-monorepo-generator [options] <destination>

Create test monorepo

Arguments:
  destination              output dir

Options:
  -V, --version            output the version number
  -p, --packages <number>  The number of workspaces to generate in the repo (default: 32)
  -l, --levels <string>    The max possible depth of dependencies (default: 3)
  -s, --seed <string>      Seed for the pseudorandom generator (default: a random seed)
  -d, --delay <delay>      Add a delay to the build commands of the workspaces (default: no delay)
  -t, --with-turbo         Add turborepo config file (default: false)
  -n, --with-nx            add nx config file (default: false)
  -h, --help               display help for command
```

### Options

#### packages

The number of packages there should be in the created repo.

Default is 32.

##### levels

Package levels controls the depth of dependency chains in the repo. This must be
at least 2. 3 is probably a good number to mimic real world monorepos.

With 2 levels there will be apps and libraries. The apps may have dependencies
on the libraries.

With 3 levels there will be apps, libraries and compound libraries. Apps may
have dependencies til both kind of libraries. compound libraries may only have
dependencies on libraries.

Default is 3

#### seed

A string seed that will set the starting state of the random values used when
generating a test repo. Given the same arguments for seed, levels and packages,
the output will be identical.

Default is a different seed every time.

#### delay

A number, or range, that controls how long each package should take to "build".

When a number is given, like "0.5" or "3", that duration in seconds is used for
every build.

When a range is given, like "1,5", the build time for each package will be a
random number of seconds between 1 and 5.

Default is no delay.

#### with-turbo

Adds turborepo config file to the repo.

Default false.

#### with-nx

Adds nx config file to the repo.

Default false.

## Programmatic use

The module exports an async `createTestRepo` function.

```javascript
import { createTestRepo } from 'test-monorepo-generator';

createTestRepo({
  destination: '/tmp/repo',
  seed: 'my-seed',
  packageCount: 32,
  packageLevels: 3,
  buildTime: 0,
  withTurbo: false,
  withNx: false,
});
```

The options object is as above, the values there work identically as the CLI
options.

The function returns a `Promise<void>`. When it resolves, the result has been
written to the destination directory.
