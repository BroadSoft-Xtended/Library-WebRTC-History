module.exports = require('webrtc-core').bdsft.Model(History, {
  config: require('../../js/config.js')
})

var Utils = require('webrtc-core').utils;
var Constants = require('webrtc-core').constants;

function Page(number, callsValue) {
  var self = {};

  self.callsAsString = function() {
    return self.calls.map(function(call) {
      return call.toString();
    }).join("~");
  };
  self.parseCalls = function(callsValue) {
    var calls = [];
    if (callsValue.trim().length > 0) {
      var callsArray = callsValue.split("~");
      for (var i = 0; i < callsArray.length; i++) {
        calls.push(new Call(i, callsArray[i]));
      }
    }
    return calls;
  };

  self.calls = self.parseCalls(callsValue);
  self.number = number;

  return self;
}

function Call(id, value) {
  var self = {};

  var values = value ? value.split("|") : [];
  self.id = id;
  self.startTime = values[0];
  self.destination = values[1];
  self.direction = values[2];
  self.stats = values[3] && JSON.parse(values[3]);
  self.length = values[4];

  self.startDate = function() {
    var date = new Date();
    date.setTime(self.startTime);
    return date.toLocaleString();
  };
  self.destinationWithoutSip = function() {
    return self.destination.replace(/sip:([^@]+)@.+/, "$1");
  };
  self.toString = function() {
    var values = [self.startTime, self.destination, self.direction, JSON.stringify(self.stats), self.length];
    return values.join("|");
  };

  return self;
}

function History(stats, eventbus, sipstack, urlconfig) {
  var self = {};

  self.props = ['isForwardEnabled', 'isBackEnabled', 'calls', 'classes', 'visible', 'pageNumber', 'callsPerPage', 'maxPages', 'callSelected'];

  self.bindings = {
    classes: {
      history: ['visible', 'enableCallHistory', 'callSelected'],
      sipstack: 'callState'
    },
    content: {
      history: ['visible', 'pageNumber']
    },
    enableCallHistory: {
      urlconfig: 'enableCallHistory'
    }
  }

  var createCall = function(rtcSession) {
    var call = new Call(self.calls.length);
    var start = rtcSession.start_time;
    call.startTime = new Date(start).getTime();
    call.destination = rtcSession.remote_identity.uri;
    if (rtcSession.direction === "outgoing") {
      call.direction = "up";
    } else {
      call.direction = "down";
    }
    call.stats = stats.getAllAvg();
    call.length = Utils.format(Math.round(Math.abs((rtcSession.end_time - start) / 1000)));
    return call;
  };

  var updateNavigation = function() {
    var pages = self.pages();
    var pagesCount = pages ? pages.length - 1 : 0;
    self.isForwardEnabled = self.pageNumber < pagesCount;
    self.isBackEnabled = self.pageNumber > 0;
  };

  self.updateContent = function() {
    updateNavigation();
    var allCalls = self.getAllCalls();
    var startPos = self.callsPerPage * self.pageNumber;
    var endPos = Math.min(startPos + self.callsPerPage, allCalls.length);
    self.calls = allCalls.slice(startPos, endPos);
  };

  self.pagesAsString = function() {
    return self.pages().map(function(page) {
      return page.callsAsString();
    });
  };

  self.pages = function() {
    var pages = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      var regex = new RegExp(Constants.HISTORY_PAGE_PREFIX + '(.*)', 'g');
      var match = regex.exec(key);
      if (match !== null && match.length > 1) {
        var value = localStorage.getItem(key);
        var page = new Page(parseInt(match[1], 10), value);
        pages.push(page);
      }
    }
    // sort pages descendingly
    pages.sort(function(page1, page2) {
      return page2.number - page1.number;
    });
    return pages;
  };

  self.deselectCall = function() {
    self.callSelected = undefined;
  };

  self.selectCall = function(index) {
    self.callSelected = 'call-selected-'+index;
  };

  self.lastCall = function() {
    return self.getAllCalls().pop();
  };

  self.getAllCalls = function() {
    var pages = self.pages();
    var calls = [];
    for (var i = 0; i < pages.length; i++) {
      calls = calls.concat(pages[i].calls);
    }
    return calls;
  };

  self.forward = function() {
    self.deselectCall();
    self.pageNumber = self.pageNumber + 1;
  };

  self.back = function() {
    self.deselectCall();
    self.pageNumber = self.pageNumber - 1;
  };

  self.clear = function() {
    var pages = self.pages();
    for (var i = 0; i < pages.length; i++) {
      localStorage.removeItem(Constants.HISTORY_PAGE_PREFIX + (pages[i].number));
    }
    self.pageNumber = 0;
    self.updateContent();
  };

  self.init = function() {
    self.pageNumber = 0;
    self.callsPerPage = 4;
    self.maxPages = 10;
  };

  self.listeners = function(settingsDatabinder, callcontrolDatabinder) {
    eventbus.on("ended", function(e) {
      self.persistCall(e.sender);
    });
    settingsDatabinder.onModelPropChange('visible', function(visible){
      visible && self.hide();
    });
    callcontrolDatabinder.onModelPropChange('visible', function(visible){
      !visible && self.hide();
    });
  };

  self.setStats = function(call) {
    stats.setAllAvg(call.stats);
  };

  self.persistPage = function(page) {
    var key = (Constants.HISTORY_PAGE_PREFIX + page.number);
    var value = page.callsAsString();
    localStorage[key] = value;
  };

  self.persistCall = function(rtcSession) {
    if (!self.enableCallHistory) {
      return;
    }
    // Get latest cookie
    var pages = self.pages();
    var page = null;
    if (pages.length > 0) {
      page = pages[0];
    } else {
      page = new Page(0, "");
    }

    if (page.calls.length >= self.callsPerPage) {
      if (page.number + 1 >= self.maxPages) {
        // remove oldest call and reorder calls to each page
        for (var i = 0; i < pages.length; i++) {
          var lastPageCall = pages[i].calls.pop();
          if (i + 1 < pages.length) {
            pages[i + 1].calls.unshift(lastPageCall);
          }
          self.persistPage(pages[i]);
        }
      } else {
        page = new Page(page.number + 1, "");
      }
    }

    // cookie vars
    var call = createCall(rtcSession);
    page.calls.unshift(call);
    self.persistPage(page);
    self.updateContent();
  };

  return self;

}