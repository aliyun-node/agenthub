'use strict';

const path = require('path');
const assert = require('assert');
const {spawnSync} = require('child_process');

const utils = require('../lib/utils');
const agenthub = path.join(__dirname, '../bin/agenthub');

function run(cmd, ...args) {
  return spawnSync(agenthub, args, {
    encoding: 'utf8'
  });
}

describe('main', function() {
  before(function () {
    let result = run(agenthub, 'stop', 'all');
    assert.equal(result.status, 0);
    result = run(agenthub, 'list');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'There is no running agenthub.\n');
  });

  after(function () {
    let result = run(agenthub, 'stop', 'all');
    assert.equal(result.status, 0);
    result = run(agenthub, 'list');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'There is no running agenthub.\n');
  });

  it('agenthub', function() {
    const result = run(agenthub);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, utils.helpText + '\n');
  });

  it('agenthub -v', function() {
    const result = run(agenthub, '-v');
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), require('../package.json').version);
  });

  it('agenthub --version', function() {
    const result = run(agenthub, '--version');
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), require('../package.json').version);
  });

  it('agenthub version', function() {
    const result = run(agenthub, 'version');
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), require('../package.json').version);
  });

  it('agenthub -h', function() {
    const result = run(agenthub, '-h');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, utils.helpText + '\n');
  });

  it('agenthub help', function() {
    const result = run(agenthub, 'help');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, utils.helpText + '\n');
  });

  it('agenthub --help', function() {
    const result = run(agenthub, '--help');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, utils.helpText + '\n');
  });

  it('agenthub start', function() {
    const cfgPath = path.join(__dirname, 'figures/config.json');
    const result = run(agenthub, 'start', cfgPath);
    assert.equal(result.status, 0);
    assert(result.stdout.startsWith('agenthub has started'));
  });

  it('agenthub list', function() {
    const result = run(agenthub, 'list');
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim().split('\n').length, 3);
  });

  it('agenthub stop', function() {
    const result = run(agenthub, 'stop');
    assert.equal(result.status, 1);
    assert(result.stdout.startsWith(`agenthub stop all`));
  });

  it('agenthub stop all', function() {
    let result = run(agenthub, 'stop', 'all');
    assert.equal(result.status, 0);
    result = run(agenthub, 'list');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'There is no running agenthub.\n');
  });

  it('agenthub stop <appid>', function() {
    // start agenthub
    const cfgPath = path.join(__dirname, 'figures/config.json');
    let result = run(agenthub, 'start', cfgPath);
    assert.equal(result.status, 0);
    assert(result.stdout.startsWith('agenthub has started'));
    // stop inexsit appid
    result = run(agenthub, 'stop', '123');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'There is no running agenthub for appid: 123.\n');
    // stop exists appid
    result = run(agenthub, 'stop', '886');
    assert.equal(result.status, 0);
    // list apps
    result = run(agenthub, 'list');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'There is no running agenthub.\n');
    result = run(agenthub, 'stop', 'all');
  });

  it('agenthub config.json', function() {
    const cfgPath = path.join(__dirname, 'figures/config.json');
    const result = run(agenthub, cfgPath);
    assert.equal(result.status, 0);
    assert(result.stdout.startsWith('agenthub has started'));
  });
});
