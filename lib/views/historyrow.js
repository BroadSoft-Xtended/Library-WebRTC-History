module.exports = require('bdsft-sdk-view')(HistoryRowView, {
  template: require('../../js/templates'), 
  style: require('../../js/styles')
})

var Utils = require('webrtc-core').utils;
var Constants = require('webrtc-core').constants;

function HistoryRowView(call, history, historyView, index) {
  var self = {};

  self.elements = ['destination', 'direction', 'date', 'length'];

  self.init = function() {
    self.view.attr('id', 'call_'+index);
    self.destination.text(call.destinationWithoutSip())
    self.direction.append("<i class='icon-arrow-" + call.direction + "-thick'></i>");
    self.date.text(Utils.formatDateTime(call.startDate()));
    self.length.text(call.length);
  };

  self.listeners = function(databinder) {
    self.view.on('click', function(e){
      e.preventDefault();
      history.setStats(call);
      historyView.callLink.attr("data-destination", call.destinationWithoutSip());
      historyView.callLink.text("Call " + call.destinationWithoutSip());
      history.selectCall(index);
    });
  };

  return self;

}