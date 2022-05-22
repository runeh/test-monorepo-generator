# Test Monorepo

This folder contains a test monorepo created by
[test-monorepo-generator](https://github.com/runeh/test-monorepo-generator).
The monorepo uses the workspaces feature and contains 32 applications
and libraries with dependencies between each other.

This can be useful when testing build tools and other monorepo tooling that
orchestrate running tasks for the workspaces.

Every package has npm scripts for `build`, `test` and `lint`. These don't
perform any real work, but the `build` task will emit a file to the `dist`
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

With the `workspaces` yarn 2 plugin:

```console
yarn workspaces foreach --topological-dev --parallel --verbose run build
```

### oao

Build all the packages with the `oao` tool:

```console
npx oao run-script --tree --parallel build
```

### Turborepo

The [turborepo](https://turborepo.org) tool requires some configuration. Check
the project's documentation.

```console
npx turbo run build
```

### nx

The [nx](https://nx.dev) tool requires some configuration. Check
the project's documentation.

```console
npx nx run-many  --target=build --all
```
