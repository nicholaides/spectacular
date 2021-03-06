// Generated by CoffeeScript 1.6.3
var Q, colorize, exists, fs, getReporter, glob, globPath, globPaths, handleEmitter, jsdom, loadDOM, loadFile, loadHelpers, loadMatchers, loadSpecs, loadSpectacular, m, path, requireFile, util, vm, walk;

m = require('module');

fs = require('fs');

glob = require('glob');

path = require('path');

vm = require('vm');

Q = require('q');

walk = require('walkdir');

util = require('util');

jsdom = require('jsdom');

colorize = function(str, color, options) {
  if ((str != null) && options.colors && str[color]) {
    return str[color];
  } else {
    return str;
  }
};

requireFile = function(file, context) {
  var err;
  try {
    return require(file);
  } catch (_error) {
    err = _error;
    return console.log(file, err);
  }
};

exists = fs.exists || path.exists;

loadSpectacular = function(options) {
  return Q.fcall(function() {
    var filename, src;
    filename = path.resolve(__dirname, "spectacular.js");
    src = fs.readFileSync(filename).toString();
    if (options.verbose) {
      console.log("  " + (colorize('load spectacular', 'grey', options)) + " " + filename);
    }
    vm.runInThisContext(src, filename);
    spectacular.env = new spectacular.Environment(options);
    return spectacular.env.globalize();
  });
};

handleEmitter = function(emitter, defer) {
  emitter.on('end', function() {
    return defer.resolve();
  });
  emitter.on('error', function(err) {
    return defer.reject(err);
  });
  return emitter.on('fail', function(err) {
    return defer.reject(err);
  });
};

loadMatchers = function(options) {
  return function() {
    var defer;
    defer = Q.defer();
    if (options.noMatchers) {
      defer.resolve();
    } else {
      exists(options.matchersRoot, function(exists) {
        var emitter;
        if (exists) {
          emitter = walk(options.matchersRoot);
          emitter.on('file', function(path, stat) {
            if (options.verbose) {
              console.log("  " + (colorize('load matcher', 'grey', options)) + " " + path);
            }
            return requireFile(path);
          });
          return handleEmitter(emitter, defer);
        } else {
          return defer.resolve();
        }
      });
    }
    return defer.promise;
  };
};

loadHelpers = function(options) {
  return function() {
    var defer;
    defer = Q.defer();
    if (options.noHelpers) {
      defer.resolve();
    } else {
      exists(options.helpersRoot, function(exists) {
        var emitter;
        if (exists) {
          emitter = walk(options.helpersRoot);
          emitter.on('file', function(path, stat) {
            if (options.verbose) {
              console.log("  " + (colorize('load helper', 'grey', options)) + " " + path);
            }
            return requireFile(path);
          });
          return handleEmitter(emitter, defer);
        } else {
          return defer.resolve();
        }
      });
    }
    return defer.promise;
  };
};

globPath = function(path) {
  var defer;
  defer = Q.defer();
  glob(path, function(err, res) {
    if (err) {
      return defer.reject(err);
    }
    return defer.resolve(res);
  });
  return defer.promise;
};

globPaths = function(globs) {
  return function() {
    var p,
      _this = this;
    return Q.all((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = globs.length; _i < _len; _i++) {
        p = globs[_i];
        _results.push(globPath(p));
      }
      return _results;
    })()).then(function(results) {
      var paths;
      paths = [];
      results.forEach(function(a) {
        return paths = paths.concat(a);
      });
      return paths;
    });
  };
};

loadSpecs = function(options) {
  return function(paths) {
    var p, _i, _j, _len, _len1;
    if (options.verbose) {
      for (_i = 0, _len = paths.length; _i < _len; _i++) {
        p = paths[_i];
        console.log("  " + (colorize('load spec', 'grey', options)) + " " + p);
      }
    }
    for (_j = 0, _len1 = paths.length; _j < _len1; _j++) {
      p = paths[_j];
      require(path.resolve('.', p));
    }
    return paths;
  };
};

getReporter = function(options) {
  var reporter;
  reporter = new spectacular.ConsoleReporter(options);
  reporter.on('message', function(event) {
    return util.print(event.target);
  });
  reporter.on('report', function(event) {
    return util.print(event.target);
  });
  return reporter;
};

loadDOM = function() {
  var defer;
  defer = Q.defer();
  jsdom.env({
    html: '<html><head></head><body></body></html>',
    features: {
      QuerySelector: true
    },
    done: function(err, window) {
      if (err != null) {
        return defer.reject(err);
      }
      return defer.resolve(window);
    }
  });
  return defer.promise;
};

loadFile = function(options) {
  var cache;
  cache = {};
  return function(file) {
    return Q.fcall(function() {
      var compile, fileContent;
      if (file in cache) {
        return cache[file];
      }
      fileContent = fs.readFileSync(file).toString();
      if (options.coffee && file.indexOf('.coffee') !== -1) {
        compile = require('coffee-script').compile;
        fileContent = compile(fileContent, {
          bare: true
        });
      }
      return cache[file] = fileContent;
    });
  };
};

exports.run = function(options) {
  var loadEndedAt, loadStartedAt;
  loadStartedAt = null;
  loadEndedAt = null;
  if (options.verbose) {
    console.log(colorize('  options', 'grey', options), options);
  }
  return loadSpectacular(options).then(loadDOM).then(function(window) {
    var reporter;
    options.loadFile = loadFile(options);
    spectacular.global.window = window;
    spectacular.global.document = window.document;
    reporter = getReporter(options);
    spectacular.env.runner.on('message', reporter.onMessage);
    spectacular.env.runner.on('result', reporter.onResult);
    return spectacular.env.runner.on('end', reporter.onEnd);
  }).then(loadMatchers(options)).then(loadHelpers(options)).then(function() {
    return loadStartedAt = new Date();
  }).then(globPaths(options.globs)).then(loadSpecs(options)).then(function(paths) {
    loadEndedAt = new Date();
    spectacular.env.runner.loadStartedAt = loadStartedAt;
    spectacular.env.runner.loadEndedAt = loadEndedAt;
    spectacular.env.runner.paths = paths;
    return spectacular.env.run();
  }).then(function(status) {
    spectacular.env.unglobalize();
    return status;
  }).fail(function(reason) {
    var reporter;
    if (spectacular.env != null) {
      reporter = getReporter(options);
      console.log(reporter.errorBadge("Spectacular failed"));
      return reporter.formatError(reason).then(function(msg) {
        console.log(msg);
        return process.exit(1);
      });
    } else {
      console.log(reason.stack);
      return process.exit(1);
    }
  });
};
