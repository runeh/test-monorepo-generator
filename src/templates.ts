import { Options } from './types';
import { dedent } from 'ts-dedent';

export function rootReadme(packageCount?: number) {
  const count = packageCount === undefined ? '?' : packageCount;
  return dedent`
    # Test Monorepo

    This folder contains a test monorepo created by
    [test-monorepo-generator](https://github.com/runeh/test-monorepo-generator).
    The monorepo uses the workspaces feature and contains ${count} applications
    and libraries with dependencies between each other.
    
    This can be useful when testing build tools and other monorepo tooling that
    orchestrate running tasks for the workspaces.
    
    Every package has npm scripts for \`build\`, \`test\` and \`lint\`. These don't
    perform any real work, but the \`build\` task will emit a file to the \`dist\`
    folder of the workspace.
    
    ## Running builds
    
    There are several tools builds workspace packages in the correct order:
    
    ### NPM
    
    Yarn 1 does not allow you to build app workspaces in the correct order without
    extra tooling.
    
    ### Yarn 1
    
    Yarn 1 does not allow you to build app workspaces in the correct order without
    extra tooling .
    
    ### Yarn 2
    
    With the \`workspaces\` yarn 2 plugin:
    
    \`\`\`console
    yarn workspaces foreach --topological-dev --parallel --verbose run build
    \`\`\`

    ### pnpm 
        
    \`\`\`console
    npx pnpm run -r build
    \`\`\`
    
    ### oao
    
    Build all the packages with the \`oao\` tool:
    
    \`\`\`console
    npx oao run-script --tree --parallel build
    \`\`\`
    
    ### Turborepo
    
    The [turborepo](https://turborepo.org) tool requires some configuration. Check
    the project's documentation.
    
    \`\`\`console
    npx turbo run build
    \`\`\`
    
    ### nx
    
    The [nx](https://nx.dev) tool requires some configuration. Check
    the project's documentation.
    
    \`\`\`console
    npx nx run-many  --target=build --all 
    \`\`\`    
  `;
}

export const gitIgnore = dedent`
  dist
  .turbo
`;

export const fakeBuildScript = dedent`
  const { mkdir, writeFileSync, mkdirSync } = require('fs');
  const { existsSync } = require('fs');
  const { join, resolve } = require('path');

  const pkgName = process.env.npm_package_name;
  const task = process.env.npm_lifecycle_event;
  const rawDuration = Number(process.argv[2]);
  const duration = isNaN(rawDuration) ? 0 : rawDuration;


  const dirPath = resolve(__dirname, 'packages', pkgName, 'dist');
  const logPath = join(dirPath, \`\${task}-log.txt\`);

  console.log(task, pkgName, 'starting');

  if (task === 'build') {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath);
    }
    writeFileSync(logPath, \`Built \${pkgName}\`, 'utf-8');
  }

  setTimeout(() => {
    console.log('done');
  }, duration);

  console.log(task, pkgName, 'end');
`;

export const turboConfig = {
  $schema: 'https://turborepo.org/schema.json',
  baseBranch: 'origin/main',
  pipeline: {
    build: {
      dependsOn: ['^build'],
      outputs: ['.next/**'],
    },
    test: {
      dependsOn: ['^build'],
      outputs: [],
    },
    lint: {
      outputs: [],
    },
    dev: {
      cache: false,
    },
  },
};

export const nxConfig = {
  extends: 'nx/presets/npm.json',
  tasksRunnerOptions: {
    default: {
      runner: 'nx/tasks-runners/default',
      options: {
        cacheableOperations: ['build', 'test', 'lint'],
      },
    },
  },
  targetDependencies: {
    build: [
      {
        target: 'build',
        projects: 'dependencies',
      },
    ],
  },
  affected: {
    defaultBase: 'master',
  },
  pluginsConfig: {
    '@nrwl/js': {
      analyzeSourceFiles: false,
    },
  },
};

export function repoPackageJson(options: Options) {
  const { destination: root, withNx, withTurbo } = options;

  const pgkJson = {
    name: 'test',
    private: true,
    workspaces: ['packages/*'],
    scripts: {
      'build-yarn1': 'echo "yarn 1 can\t build topological out of the box"',
      'build-yarn2':
        'yarn workspaces foreach --topological-dev --parallel --verbose run build',
      'build-oao': 'npx oao run-script --tree --parallel build',
    } as Record<string, string>,
    devDependencies: {} as Record<string, string>,
  };

  if (withNx) {
    pgkJson.devDependencies['nx'] = '^14.1.0';
    pgkJson.scripts['build-nx'] = 'npx nx run-many --target=build --all';
  }

  if (withTurbo) {
    pgkJson.scripts['build-turbo'] = 'npx turbo run build';
  }

  return pgkJson;
}
