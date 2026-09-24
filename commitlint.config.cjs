'use strict';

/* eslint-env node */
/* eslint-disable no-undef */

const types = [
   'build', 'chore', 'ci', 'config', 'docs', 'feat', 'fix', 'perf',
   'refactor', 'revert', 'style', 'test',
];

module.exports = {
   rules: {
      'body-leading-blank': [ 2, 'always' ],
      'body-max-line-length': [ 2, 'always', 90 ],
      'footer-leading-blank': [ 2, 'always' ],
      'footer-max-line-length': [ 2, 'always', 90 ],
      'header-max-length': [ 2, 'always', 100 ],
      'scope-case': [ 2, 'always', [ 'lower-case', 'kebab-case' ] ],
      'scope-enum': [
         2,
         'always',
         types.concat([ 'mcp', 'bridge', 'tauri-mcp-server', 'tauri-plugin-mcp-bridge', 'cli' ]),
      ],
      'subject-case': [ 2, 'never', [ 'upper-case' ] ],
      'subject-empty': [ 2, 'never' ],
      'subject-full-stop': [ 2, 'never', '.' ],
      'type-case': [ 2, 'always', 'lower-case' ],
      'type-empty': [ 2, 'never' ],
      'type-enum': [ 2, 'always', types.concat([ 'sub' ]) ],
   },
   defaultIgnores: false,
   ignores: [ (commit) => { return [ 'Merge', 'Revert' ].some((prefix) => { return commit.startsWith(prefix); }); } ],
};
