'use strict';
var execSync = require('child_process').execSync;
var conventionalChangelogCore = require('conventional-changelog-core');
var preset = require('../');
var expect = require('chai').expect;
var gitDummyCommit = require('git-dummy-commit');
var shell = require('shelljs');
var through = require('through2');
var betterThanBefore = require('better-than-before')();
var preparing = betterThanBefore.preparing;

betterThanBefore.setups([
  function() {
    shell.config.silent = true;
    shell.rm('-rf', 'tmp');
    shell.mkdir('tmp');
    shell.cd('tmp');
    shell.mkdir('git-templates');
    shell.exec('git init --template=./git-templates');

    gitDummyCommit('Merged PR 829: chore: first commit');
    gitDummyCommit(['Merged PR 829: feat: amazing new module', 'BREAKING CHANGE: Not backward compatible.']);
    gitDummyCommit(['Merged PR 829: fix(compile): avoid a bug', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['Merged PR 829: perf(ngOptions): make it faster', ' closes #1, #2']);
    gitDummyCommit('Merged PR 829: revert(ngOptions): bad commit');
    gitDummyCommit('Merged PR 829: fix(*): oops');
  },
  function() {
    gitDummyCommit(['Merged PR 829: feat(awesome): addresses the issue brought up in #133']);
  },
  function() {
    gitDummyCommit(['Merged PR 829: feat(awesome): fix #88']);
  },
  function() {
    gitDummyCommit(['Merged PR 829: feat(awesome): issue brought up by @bcoe! on Friday']);
  },
  function() {
    gitDummyCommit(['Merged PR 829: docs(readme): make it clear', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['Merged PR 829: style(whitespace): make it easier to read', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['Merged PR 829: refactor(code): change a lot of code', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['Merged PR 829: test(*): more tests', 'BREAKING CHANGE: The Change is huge.']);
    gitDummyCommit(['Merged PR 829: chore(deps): bump', 'BREAKING CHANGE: The Change is huge.']);
  },
  function() {
    gitDummyCommit(['Merged PR 829: feat(deps): bump', 'BREAKING CHANGES: Also works :)']);
  },
  function() {
    shell.exec('git tag v1.0.0');
    gitDummyCommit('Merged PR 829: feat: some more features');
  },
  function() {
    gitDummyCommit('Merged PR 829: feat(cool-scope): some more features closes #1234');
  }
]);

describe('angular preset', function() {
  it('should work if there is no semver tag', function(done) {
    preparing(1);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('amazing new module');
        expect(chunk).to.include('**compile:** avoid a bug');
        expect(chunk).to.include('make it faster');
        expect(chunk).to.include(', closes [#1](https://github.com/conventional-changelog/conventional-changelog-angular/issues/1) [#2](https://github.com/conventional-changelog/conventional-changelog-angular/issues/2)');
        expect(chunk).to.include('Not backward compatible.');
        expect(chunk).to.include('**compile:** The Change is huge.');
        expect(chunk).to.include('Features');
        expect(chunk).to.include('Bug Fixes');
        expect(chunk).to.include('Performance Improvements');
        expect(chunk).to.include('Reverts');
        expect(chunk).to.include('bad commit');
        expect(chunk).to.include('BREAKING CHANGES');

        expect(chunk).to.not.include('first commit');
        expect(chunk).to.not.include('feat');
        expect(chunk).to.not.include('fix');
        expect(chunk).to.not.include('perf');
        expect(chunk).to.not.include('revert');
        expect(chunk).to.not.include('***:**');
        expect(chunk).to.not.include(': Not backward compatible.');
        done();
      }));
  });

  it('should replace #[0-9]+ with GitHub issue URL', function(done) {
    preparing(2);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[#133](https://github.com/conventional-changelog/conventional-changelog-angular/issues/133)');
        done();
      }));
  });

  it('should remove the issues that already appear in the subject', function(done) {
    preparing(3);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[#88](https://github.com/conventional-changelog/conventional-changelog-angular/issues/88)');
        expect(chunk).to.not.include('closes [#88](https://github.com/conventional-changelog/conventional-changelog-angular/issues/88)');
        done();
      }));
  });

  it('should replace @username with GitHub user URL', function(done) {
    preparing(4);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();
        expect(chunk).to.include('[@bcoe](https://github.com/bcoe)');
        done();
      }));
  });

  it('should not discard commit if there is BREAKING CHANGE', function(done) {
    preparing(5);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('Documentation');
        expect(chunk).to.include('Styles');
        expect(chunk).to.include('Code Refactoring');
        expect(chunk).to.include('Tests');
        expect(chunk).to.include('Chores');

        done();
      }));
  });

  it('should BREAKING CHANGES the same as BREAKING CHANGE', function(done) {
    preparing(6);

    conventionalChangelogCore({
      config: preset
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk) {
        chunk = chunk.toString();

        expect(chunk).to.include('Also works :)');

        done();
      }));
  });

  it('should work if there is a semver tag', function(done) {
    preparing(7);
    var i = 0;

    conventionalChangelogCore({
      config: preset,
      outputUnreleased: true
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('some more features');
        expect(chunk).to.not.include('BREAKING');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });

  it('should work with unknown host', function(done) {
    preparing(7);
    var i = 0;

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: __dirname + '/fixtures/_unknown-host.json'
      }
    })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();

        expect(chunk).to.include('(http://unknown/compare');
        expect(chunk).to.include('](http://unknown/commits/');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });

it('should work with vstst host', function(done) {
    preparing(8);
    var i = 0;

    conventionalChangelogCore({
      config: preset,
      pkg: {
        path: __dirname + '/fixtures/_vstst-host.json'
      }
    }, { commit: 'commit' })
      .on('error', function(err) {
        done(err);
      })
      .pipe(through(function(chunk, enc, cb) {
        chunk = chunk.toString();
        console.log(chunk);

        expect(chunk).to.include('(https://testing.visualstudio.com/testing-project/_git/testing-repo/compare');
        expect(chunk).to.include('](https://testing.visualstudio.com/testing-project/_git/testing-repo/commit/');

        i++;
        cb();
      }, function() {
        expect(i).to.equal(1);
        done();
      }));
  });
});
