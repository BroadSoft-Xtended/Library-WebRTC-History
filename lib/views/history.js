module.exports = require('webrtc-core').bdsft.View(HistoryView, {
  template: require('../../js/templates'), 
  style: require('../../js/styles')
})

var Utils = require('webrtc-core').utils;
var Constants = require('webrtc-core').constants;

function HistoryView(eventbus, sound, history) {
  var self = {};

  self.model = history;

  self.rows = [];

  var setDetailValue = function(name, value){
    self[name].text(value);
    if(!value || value === 'undefinedxundefined' || value === 'NaN') {
      self[name+'Row'].addClass('hidden');
    } else {
      self[name+'Row'].removeClass('hidden');
    }
  };

  var callDetailsHandler = function(call) {
    return function(e) {
      e.preventDefault();
      setDetailValue('resolutionIn', call.resolutionIn);
      setDetailValue('resolutionOut', call.resolutionOut);
      setDetailValue('bitrateIn', call.bitrateIn);
      setDetailValue('bitrateOut', call.bitrateOut);
      setDetailValue('frameRateIn', call.frameRateIn);
      setDetailValue('frameRateOut', call.frameRateOut);
      setDetailValue('audioLostPer', call.audioLostPer);
      setDetailValue('videoLostPer', call.videoLostPer);
      setDetailValue('jitter', call.jitter);
      self.callLink.attr("data-destination", call.destinationWithoutSip());
      self.callLink.text("Call " + call.destinationWithoutSip());
      self.callHistoryDetails.show();
      self.callHistory.css({
        width: "416px"
      });
      Utils.getElement(".history-row").removeClass("active");
      // TODO - missing property to activate
      Utils.getElement(self).addClass("active");
    };
  };

  var updateContent = function(calls) {
    self.content.html("");
    self.rows = [];
    calls.forEach(function(call, i){
      var row = self.historyRowSample.clone();
      row.attr('id', '');
      row.attr('class', 'history-row');
      row.bind("click", callDetailsHandler(call));
      row.find(".historyCall").text((history.pageNumber * 10) + i + 1);
      row.find(".hist-destination").text(call.destinationWithoutSip());
      //row.find(".historyDirection").text(call.direction);
      row.find(".hist-direction").append("<i class='icon-arrow-" + call.direction + "-thick'></i>");
      //row.find(".historyDate").text(call.startDate());
      row.find(".hist-date").text(Utils.formatDateTime(call.startDate()));
      row.find(".hist-length").text(call.length);
      self.rows.push(row);
      row.appendTo(self.content);
    });
  };

  self.elements = ['content', 'historyForward', 'historyForwardIcon', 'historyBack', 'historyBackIcon', 'callHistoryDetails', 'historyDetailsClose', 
  'resolutionIn', 'resolutionOut', 'bitrateIn', 'bitrateOut', 'frameRateIn', 'frameRateOut', 'audioLostPer', 'videoLostPer', 'jitter',
  'resolutionInRow', 'resolutionOutRow', 'bitrateInRow', 'bitrateOutRow', 'frameRateInRow', 'frameRateOutRow', 'audioLostPerRow', 'videoLostPerRow', 'jitterRow',
    'historyClear', 'callLink', 'historyRowSample', 'historyClose', 'callHistory'
  ];

  self.listeners = function(databinder) {
    databinder.onModelPropChange('isForwardEnabled', function(value){
      self.historyForwardIcon.toggle(value);
    });
    databinder.onModelPropChange('isBackEnabled', function(value){
      self.historyBackIcon.toggle(value);
    });
    databinder.onModelPropChange('calls', function(calls){
      updateContent(calls);
    });
    self.historyForward.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.forward();
    });

    self.historyBack.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.back();
    });

    self.historyClose.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      self.hide();
    });

    self.historyDetailsClose.bind('click', function(e) {
      e.preventDefault();
      self.callHistoryDetails.hide();
      self.callHistory.css({
        width: "200px"
      });
    });

    self.callLink.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      var destination = self.callLink.attr("data-destination");
      eventbus.call(destination);
      self.callHistory.css({
        width: "200px"
      });
      self.view.hide();
      self.callHistoryDetails.hide();
    });

    self.historyClear.bind('click', function(e) {
      e.preventDefault();
      sound.playClick();
      history.clear();
    });
  };

  return self;

}