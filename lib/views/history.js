module.exports = require('webrtc-core').bdsft.View(HistoryView, {
  template: require('../../js/templates'), 
  style: require('../../js/styles')
})

var Utils = require('webrtc-core').utils;
var HistoryRow = require('./historyrow');
// var Factory = require('webrtc-core').factory;
var Constants = require('webrtc-core').constants;

function HistoryView(sound, history, statsView, callcontrol) {
  var self = {};

  self.model = history;

  self.rows = [];

  var updateContent = function(calls) {
    self.content.html("");
    self.rows = [];
    calls.forEach(function(call, i){
      var row = HistoryRow.create([call, history, self, i]);
      self.rows.push(row);
      row.view.appendTo(self.content);
    });
  };

  self.elements = ['content', 'forward', 'back', 'detailsClose', 'clear', 'callLink', 'close', 'statsHolder'];

  self.init = function() {
    statsView.view.appendTo(self.statsHolder);
  };

  self.listeners = function(databinder) {
    databinder.onModelPropChange('isForwardEnabled', function(value){
      self.forward.toggle(value);
    });
    databinder.onModelPropChange('isBackEnabled', function(value){
      self.back.toggle(value);
    });
    databinder.onModelPropChange('calls', function(calls){
      updateContent(calls);
    });
    self.forward.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.forward();
    });

    self.back.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.back();
    });

    self.close.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.hide();
    });

    self.detailsClose.bind('click', function(e) {
      e.preventDefault();
      history.deselectCall();
    });

    self.callLink.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      var destination = self.callLink.attr("data-destination");
      callcontrol.call(destination);
      history.hide();
      history.deselectCall();
    });

    self.clear.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.clear();
    });
  };

  return self;

}