#!/usr/bin/env node
'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var agenthubBin = process.argv[1];
var agenthubStatusPath = path.join(os.homedir(), '.agenthub.pid');

var listHeader =
'\n|--appid--|---pid---|--/path/to/config------------------------------------------';

var listFooter =
'|---------|---------|-----------------------------------------------------------';

var format = function (data, width) {
  data = data.toString();
  if (data.length >= width) {
    return data;
  }
  var len = data.length;
  for (var i = 0; i < width - len; i++) {
    data += ' ';
  }
  return data;
};

var contentShaping = function (appid, pid, config) {
  appid = format(appid, 9);
  pid = format(pid, 9);
  config = format(config, 32);
  return '|' + [appid, pid, config].join('|');
}

/* if running return true, else return false */
var isRunning = function (pid) {
  try {
    return process.kill(pid, 0);
  } catch (err) {
    return false;
  }
}

var killRunning = function (pid) {
  if (isRunning(pid)) {
    try {
      process.kill(pid);
      return true;
    } catch (e){
      return false;
    }
  } else {
    return false;
  }
}

var isAppid = function (appid) {
  if (!appid) {
    return false;
  }

  var appid = appid.toString();
  if (appid.length === 0) {
    return false;
  }
  for (var i = 0; i < appid.length; i++) {
    if (appid[i] < '0' || appid[i] > '9') {
      return false;
    }
  }
  return true;
};

var getAppidFromConfig = function (config_path) {
  if (!config_path) {
    console.log('config.json not provided.')
    return undefined;
  }
  config_path = path.resolve(config_path);
  if (!fs.existsSync(config_path)) {
    console.log(config_path, 'is not a file.')
    return undefined;
  }
  var raw = fs.readFileSync(config_path, 'utf8');
  try {
    var cfg = JSON.parse(raw);
    if (!cfg.appid || ! cfg.secret) {
      console.log('appid and secret must be provided');
      return undefined;
    } else {
      return cfg.appid;
    }
  } catch (err) {
    console.log(config_path, 'is not a json file.', err);
    return undefined;
  }
};

var stopAllAgenthubs = function () {
  var agenthubs = getAgenthubStatus();
  agenthubs.forEach(function(agenthub) {
    killRunning(agenthub.pid);
  });
};

var stopAgenthubFromAppid = function (appid) {
  var killed = false;
  var agenthubs = getAgenthubStatus();
  agenthubs.forEach(function(agenthub) {
    if (agenthub.appid === appid) {
      killed = true;
      killRunning(agenthub.pid);
    }
  });
  if (killed) {
    return true;
  }
  return false;
};

var reloadAllAgenghubs = function () {
  var reloaded = false;
  var agenthubs = getAgenthubStatus();
  for (var i = 0; i < agenthubs.length; i++) {
    var agenthub = agenthubs[i];
    if (killRunning(agenthub.pid)) {
      spawn(agenthubBin, [agenthub.config], {detached: true});
      reloaded = true;
    }
  }
  if (!reloaded) {
    console.log('There is no running agenthub to reload.');
  }
};

var reloadAgenthubFromAppid = function (appid) {
  var reloaded = false;
  var agenthubs = getAgenthubStatus();
  for (var i = 0; i < agenthubs.length; i++) {
    var agenthub = agenthubs[i];
    if (agenthub.appid === appid) {
      if (killRunning(agenthub.pid)) {
        spawn(agenthubBin, [agenthub.config], {detached: true});
        reloaded = true;
      }
    }
  }
  if (!reloaded) {
    console.log('There is no running agenthub to reload for appid: ', appid);
  }
};


var clearAgenthubStatus = function () {
  fs.writeFileSync(agenthubStatusPath, '');
};

var appendAgenthubStatus = function (appid, pid, config) {
  fs.appendFileSync(agenthubStatusPath, [appid, pid, config].join('\u0000') + '\n');
};

/* get from ~/.agenthub.pid
   return [{appid: 123, pid: 3868, config: '/path/to/config.json'}, ... ]
*/
var getAgenthubStatus = function () {
  if (!fs.existsSync(agenthubStatusPath)) {
    return [];
  }

  var agenthubs = [];

  var raw = fs.readFileSync(agenthubStatusPath, 'utf8').trim().split('\n')
  raw.forEach(function(one) {
    if (one.length <= 0) {
      return;
    }
    var agent = one.split('\u0000');
    var agenthub = {appid: agent[0], pid: agent[1], config: agent[2]};
    agenthubs.push(agenthub);
  })
  return agenthubs;
};

/* only kepp running agenthub */
var updateAgentStatus = function () {
  var agenthubs = getAgenthubStatus();
  clearAgenthubStatus();
  for (var i = 0; i < agenthubs.length; i++) {
    if (isRunning(agenthubs[i].pid)) {
      appendAgenthubStatus(agenthubs[i].appid, agenthubs[i].pid, agenthubs[i].config);
    }
  }
}

var printUsage = function () {
  var help = [
  '',
  'Usage: agenthub [CMD]... [ARGS] ',
  '',
  '  -v --version           show agenthub version',
  '  -h --help              show this usage',
  '  --list                 show running agenthub(s)',
  '  --start config.json    start agenthub with config.json',
  '  --stop all             stop all running agenthub(s)',
  '  --stop appid           stop running agenthub(s) for the appid',
  '  --restart config.json  stop the agenthub for appid in config.json if exists',
  '                         then start agenthub with config.json',
  '  --reload all           reload all running agenthub(s)',
  '                         config file is the same when it started',
  '                         config para may be changed or not',
  '  --reload appid         reload the running agenthub for the appid',
  '                         config file is the same when it started',
  '                         config para may be changed or not '
  ].join('\n');
  console.log(help);
};

exports.argvHandler = function(argv) {

  if (argv.length < 1) {
    printUsage();
    process.exit(1);
  }

  switch (argv[0]) {
    case '-v':
    case '--version':
      console.log(require('./package.json').version);
      process.exit(0);
      break;
    case '-h':
    case '--help':
      printUsage();
      process.exit(0);
      break;
    case '-l':
    case '--list':
      var agenthubs = getAgenthubStatus();
      if (agenthubs.length === 0) {
        console.log('There is no running agenthub.');
        process.exit(0);
      }
      console.log(listHeader);
      agenthubs.forEach(function(agenthub) {
        if (isRunning(agenthub.pid)) {
          console.log(contentShaping(agenthub.appid, agenthub.pid, agenthub.config));
        }
      });
      console.log(listFooter);
      process.exit(0);
      break;
    case '--stop':
      if (argv[1] === 'all') {
        stopAllAgenthubs();
      } else if (isAppid(argv[1])) {
        if (!stopAgenthubFromAppid(argv[1])) {
          console.log('There is no running agenthub for appid:', argv[1]);
        }
      } else {
        console.log('agenthub --stop all    stop all agenthubs');
        console.log('agenthub --stop appid  stop the agenthub(s) for appid');
      }
      updateAgentStatus();
      process.exit(1);
      break;
    case '--start':
      var appid = getAppidFromConfig(argv[1]);
      if (!appid) {
        process.exit(1);
      }
      var cfgPath = path.resolve(argv[1]);
      spawn(agenthubBin, [cfgPath], {detached: true});
      process.exit(0);
      break;
    case '--restart':
      var appid = getAppidFromConfig(argv[1]);
      if (!appid) {
        process.exit(1);
      }
      stopAgenthubFromAppid(appid);
      var cfgPath = path.resolve(argv[1]);
      spawn(agenthubBin, [cfgPath], {detached: true});
      appendAgenthubStatus(appid, process.pid, cfgPath);
      updateAgentStatus();
      process.exit(0);
      break;
    case '--reload':
      if (argv[1] === 'all') {
        reloadAllAgenghubs();
      } else if (isAppid(argv[1])) {
        reloadAgenthubFromAppid(argv[1])
      } else {
        console.log('Please provide a valid appid for reload');
      }
      updateAgentStatus();
      process.exit(0);
      break;

    default:
      var appid = getAppidFromConfig(argv[0]);
      if (!appid) {
        printUsage();
        process.exit(1);
      }
      appendAgenthubStatus(appid, process.pid, path.resolve(argv[0]));
      return argv[0];
      break;
  }
};
