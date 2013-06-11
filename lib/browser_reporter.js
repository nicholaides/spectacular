// Generated by CoffeeScript 1.6.3
var addClass, cache, fixNodeHeight, hasClass, loaders, removeClass, toggleClass, utils, wrapNode,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

utils = spectacular.utils;

wrapNode = function(node) {
  if (node.length != null) {
    return node;
  } else {
    return [node];
  }
};

hasClass = function(nl, cls) {
  nl = wrapNode(nl);
  return Array.prototype.every.call(nl, function(n) {
    return n.className.indexOf(cls) !== -1;
  });
};

addClass = function(nl, cls) {
  nl = wrapNode(nl);
  return Array.prototype.forEach.call(nl, function(node) {
    if (!hasClass(node, cls)) {
      return node.className += " " + cls;
    }
  });
};

removeClass = function(nl, cls) {
  nl = wrapNode(nl);
  return Array.prototype.forEach.call(nl, function(node) {
    return node.className = node.className.replace(cls, '');
  });
};

toggleClass = function(nl, cls) {
  nl = wrapNode(nl);
  return Array.prototype.forEach.call(nl, function(node) {
    if (hasClass(node, cls)) {
      return removeClass(node, cls);
    } else {
      return addClass(node, cls);
    }
  });
};

fixNodeHeight = function(nl) {
  nl = wrapNode(nl);
  return Array.prototype.forEach.call(nl, function(node) {
    return node.style.height = "" + node.clientHeight + "px";
  });
};

spectacular.BrowserStackReporter = (function(_super) {
  __extends(BrowserStackReporter, _super);

  BrowserStackReporter.reports = 0;

  function BrowserStackReporter(error, options) {
    this.error = error;
    this.options = options;
    this.id = BrowserStackReporter.reports;
    BrowserStackReporter.reports += 1;
  }

  BrowserStackReporter.prototype.report = function() {
    var c, column, e, line, match, pre, stack, url, _ref,
      _this = this;
    if (!this.error.stack) {
      return '';
    }
    stack = this.error.stack.split('\n').filter(function(line) {
      return /( at |@)/g.test(line);
    });
    line = stack.shift();
    pre = "<pre id='pre_" + this.id + "_source' class='loading'></pre>\n<pre id='pre_" + this.id + "_stack'>" + (utils.escape(this.formatStack(stack))) + "</pre>";
    _ref = /(http:\/\/.*\.(js|coffee)):(\d+)(:(\d+))*/g.exec(line), match = _ref[0], url = _ref[1], e = _ref[2], line = _ref[3], c = _ref[4], column = _ref[5];
    if ((column == null) && (this.error.columnNumber != null)) {
      column = this.error.columnNumber + 1;
    }
    this.getLines(url, parseInt(line), parseInt(column)).then(function(msg) {
      var source;
      source = document.getElementById("pre_" + _this.id + "_source");
      source.innerHTML = msg;
      removeClass(source, 'loading');
      return fixNodeHeight(source);
    });
    return pre;
  };

  return BrowserStackReporter;

})(spectacular.StackReporter);

spectacular.BrowserReporter = (function() {
  var STATE_CHARS;

  STATE_CHARS = {
    pending: '*',
    skipped: 'x',
    failure: 'F',
    errored: 'E',
    success: '.'
  };

  function BrowserReporter(options) {
    var buttons, html;
    this.options = options;
    this.onResult = __bind(this.onResult, this);
    this.onEnd = __bind(this.onEnd, this);
    this.errorsCounter = 1;
    this.failuresCounter = 1;
    this.errors = [];
    this.failures = [];
    this.skipped = [];
    this.pending = [];
    this.results = [];
    this.examples = [];
    this.reporter = document.createElement('div');
    this.reporter.id = 'reporter';
    this.reporter.innerHTML = "<header>\n  <h1>Spectacular</h1>\n  <h2>" + spectacular.version + "</h2>\n  <pre></pre>\n  <p></p>\n</header>\n<section id=\"controls\">" + (['success', 'pending', 'errored', 'failure', 'skipped'].map(function(k) {
      return "<button class='toggle " + k + "'>" + k + "</button>";
    }).join('\n')) + "\n</section>\n<section id=\"examples\"></section>\n<footer></footer>";
    html = document.querySelector('html');
    buttons = this.reporter.querySelectorAll('button.toggle');
    Array.prototype.forEach.call(buttons, function(button) {
      return button.onclick = function(e) {
        toggleClass(html, "hide-" + button.textContent);
        return toggleClass(button, "off");
      };
    });
    this.examplesContainer = this.reporter.querySelector('#examples');
    this.progress = this.reporter.querySelector('header pre');
    this.counters = this.reporter.querySelector('header p');
  }

  BrowserReporter.prototype.onEnd = function(event) {
    var counters, html, runner;
    html = document.querySelector('html');
    runner = event.target;
    window.resultReceived = true;
    window.result = !this.hasFailures();
    if (result) {
      addClass(html, 'success');
    } else {
      addClass(html, 'failure');
    }
    counters = this.counters.querySelector('#counters');
    return counters.innerHTML = "" + counters.innerHTML + ", finished in " + (this.formatDuration(runner.specsStartedAt, runner.specsEndedAt));
  };

  BrowserReporter.prototype.link = function(example, id) {
    var link;
    link = document.createElement('a');
    link.className = example.result.state;
    link.setAttribute('href', "#example_" + id);
    link.setAttribute('title', example.description);
    link.innerHTML = this.stateChar(example.result.state);
    return link;
  };

  BrowserReporter.prototype.stateChar = function(state) {
    return STATE_CHARS[state];
  };

  BrowserReporter.prototype.onResult = function(event) {
    var e, ex, example, id, pres;
    example = event.target;
    this.results.push(example.result);
    this.examples.push(example);
    this.progress.appendChild(this.link(example, this.examples.length));
    this.counters.innerHTML = this.formatCounters();
    switch (example.result.state) {
      case 'pending':
        this.pending.push(example);
        break;
      case 'skipped':
        this.skipped.push(example);
        break;
      case 'errored':
        this.errors.push(example);
        break;
      case 'failure':
        this.failures.push(example);
    }
    id = this.examples.length;
    ex = document.createElement('article');
    ex.id = "example_" + id;
    ex.className = "example preload " + example.result.state;
    ex.dataset.id = id;
    if (example.result.expectations.length > 0) {
      ex.innerHTML = "<header>\n  <h4>" + example.description + "</h4>\n  <span class='result'>" + example.result.state + "</span>\n  <span class='time'><span class='icon-time'></span>" + (example.duration / 1000) + "s</span>\n</header>\n<div class=\"expectations\">\n  " + (((function() {
        var _i, _len, _ref, _results;
        _ref = example.result.expectations;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          e = _ref[_i];
          _results.push(this.formatExpectation(e));
        }
        return _results;
      }).call(this)).join('')) + "\n</div>";
    } else {
      ex.innerHTML = "<header>\n  <h4>" + example.description + "</h4>\n  <span class='result'>" + example.result.state + "</span>\n  <span class='time'><span class='icon-time'></span>" + example.duration + "s</span>\n</header>\n" + (example.reason != null ? "<aside>      <pre>" + (utils.escapeDiff(example.reason.message)) + "</pre>      " + (example.reason != null ? this.traceSource(example.reason) : '') + "    </aside>" : '');
    }
    ex.onclick = function() {
      return toggleClass(ex, 'closed');
    };
    this.examplesContainer.appendChild(ex);
    pres = ex.querySelectorAll('pre:not([id])');
    Array.prototype.forEach.call(pres, function(node) {
      return fixNodeHeight(node);
    });
    addClass(ex, 'closed');
    return removeClass(ex, 'preload');
  };

  BrowserReporter.prototype.formatExpectation = function(expectation) {
    return "<div class=\"expectation " + (expectation.success ? 'success' : 'failure') + "\">\n  <h5>" + expectation.description + "</h5>\n  <pre>" + (utils.escapeDiff(expectation.message)) + "</pre>\n  " + (expectation.trace != null ? this.traceSource(expectation.trace) : '') + "\n</div>";
  };

  BrowserReporter.prototype.traceSource = function(error) {
    return (new spectacular.BrowserStackReporter(error, this.options)).report();
  };

  BrowserReporter.prototype.formatCounters = function() {
    var assertions, errored, failures, pending, skipped, success;
    failures = this.failures.length;
    errored = this.errors.length;
    skipped = this.skipped.length;
    pending = this.pending.length;
    success = this.examples.length - failures - errored - pending - skipped;
    assertions = this.results.reduce((function(a, b) {
      return a + b.expectations.length;
    }), 0);
    return "<span id='counters'>    " + (this.formatResults(success, failures, errored, skipped, pending, assertions)) + "    </span>";
  };

  BrowserReporter.prototype.formatResults = function(s, f, e, sk, p, a) {
    var he;
    he = f + e;
    return ("" + (this.formatCount(s, 'success', 'success', this.toggle(he, 'success'))) + ",    " + (this.formatCount(a, 'assertion', 'assertions', this.toggle(he, 'success'))) + ",    " + (this.formatCount(f, 'failure', 'failures', this.toggle(he, 'success', 'failure'))) + ",    " + (this.formatCount(e, 'error', 'errors', this.toggle(e, 'success', 'errored'))) + ",    " + (this.formatCount(sk, 'skipped', 'skipped', this.toggle(sk, 'success', 'skipped'))) + ",    " + (this.formatCount(p, 'pending', 'pending', this.toggle(p, 'success', 'pending')))).replace(/\s+/g, ' ');
  };

  BrowserReporter.prototype.formatCount = function(value, singular, plural, color) {
    var s;
    s = value === 0 ? plural : value === 1 ? singular : plural;
    if (color != null) {
      s = "<span class='" + color + "'>" + value + "</span> " + s;
    } else {
      s = "<span>" + value + "</span> " + s;
    }
    return s;
  };

  BrowserReporter.prototype.toggle = function(value, c1, c2) {
    if (value) {
      return c2;
    } else {
      return c1;
    }
  };

  BrowserReporter.prototype.formatDuration = function(start, end) {
    var duration;
    duration = (end.getTime() - start.getTime()) / 1000;
    duration = "<span class='yellow'>" + (Math.max(0, duration)) + "s</span>";
    return duration;
  };

  BrowserReporter.prototype.hasFailures = function() {
    return this.results.some(function(result) {
      var _ref;
      return (_ref = result.state) === 'failure' || _ref === 'skipped' || _ref === 'errored';
    });
  };

  BrowserReporter.prototype.appendToBody = function() {
    return document.querySelector('body').appendChild(this.reporter);
  };

  return BrowserReporter;

})();

cache = {};

loaders = {};

options.loadFile = function(file) {
  var listener, promise, req;
  promise = new spectacular.Promise;
  if (file in cache) {
    setTimeout((function() {
      return promise.resolve(cache[file]);
    }), 0);
    return promise;
  }
  if (file in loaders) {
    loaders[file].push(function(data) {
      return promise.resolve(data);
    });
    return promise;
  }
  req = new XMLHttpRequest();
  req.onload = function() {
    var data;
    data = this.responseText;
    return loaders[file].forEach(function(f) {
      return f(data);
    });
  };
  listener = function(data) {
    return promise.resolve(cache[file] = data);
  };
  loaders[file] = [listener];
  req.open('get', file, true);
  req.send();
  return promise;
};

spectacular.env = new spectacular.Environment(options);

spectacular.env.globalize();

spectacular.env.runner.loadStartedAt = new Date();

spectacular.env.runner.paths = paths;

window.onload = function() {
  var reporter;
  reporter = new spectacular.BrowserReporter(options);
  reporter.appendToBody();
  spectacular.env.runner.on('result', reporter.onResult);
  spectacular.env.runner.on('end', reporter.onEnd);
  spectacular.env.runner.loadEndedAt = new Date();
  spectacular.env.runner.specsStartedAt = new Date();
  return spectacular.env.run().fail(function(reason) {
    return console.log(reason);
  });
};