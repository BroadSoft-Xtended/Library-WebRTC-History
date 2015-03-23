var jsdom = require('mocha-jsdom');
expect = require('expect');
jsdom({});

describe('history', function() {

  before(function(){
    core = require('webrtc-core');
    testUA = core.testUA;
    var config = {enableCallHistory: true};
    testUA.createCore('eventbus');
    testUA.createCore('configuration', config);
    testUA.createCore('sipstack', config);
    testUA.createModelAndView('stats', {stats: require('webrtc-stats')});
    testUA.createModelAndView('history', {history: require('../'), stats: require('webrtc-stats')});
    testUA.mockWebRTC();
    testUA.setupLocalStorage();
    mockStats();
    rtcSession = createRtcSession();
    session1 = createRtcSession("remote1")
    session2 = createRtcSession("remote2")
    session3 = createRtcSession("remote3")
    session4 = createRtcSession("remote4")
    session5 = createRtcSession("remote5")
  });
  beforeEach(function() {
    localStorage.clear();
    testUA.deleteAllCookies();
    configuration.enableCallHistory = true;
  });

  it('history show and hide', function() {
    eventbus.toggleView(core.constants.VIEW_HISTORY);    
    testUA.isVisible(historyview.callHistory, true);
    eventbus.toggleView(core.constants.VIEW_HISTORY);    
    testUA.isVisible(historyview.callHistory, false);
  });
  it('persistCall:', function() {
    bdsft_client_instances.history_test.persistCall(rtcSession);
    expect(localStorage.length).toEqual(1);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue());
    expect(bdsft_client_instances.history_test.pagesAsString(), [getCallCookieValue()]);
  });
  it('persistCall and toggle:', function() {
    bdsft_client_instances.history_test.persistCall(rtcSession);
    historyview.toggle();
    expect(bdsft_client_instances.history_test.pageNumber).toEqual(0);
    expect(historyview.historyForward.is(":visible")).toEqual(false);
    expect(historyview.historyBack.is(":visible")).toEqual(false);
    expect(historyview.content.text().indexOf("remote") !== -1).toEqual(true, "Should contain content");
  });

  it('persistCall and toggle and show details', function() {
    bdsft_client_instances.history_test.persistCall(rtcSession);
    historyview.toggle();
    historyview.rows[0].trigger("click");
    expect(historyview.callHistoryDetails.is(":visible")).toEqual(true, "Should show details");
    expect(historyview.resolutionIn.text()).toEqual("test-video-googFrameWidthReceivedxtest-video-googFrameHeightReceived");
    expect(historyview.resolutionOut.text()).toEqual("test-video-googFrameWidthSentxtest-video-googFrameHeightSent");
    expect(historyview.bitrateIn.text()).toEqual("avg-video-kiloBitsReceivedPerSecond");
    expect(historyview.bitrateOut.text()).toEqual("avg-video-kiloBitsSentPerSecond");
    expect(historyview.frameRateIn.text()).toEqual("avg-video-googFrameRateReceived");
    expect(historyview.frameRateOut.text()).toEqual("avg-video-googFrameRateSent");
    expect(historyview.audioLostPer.text()).toEqual("avg-audio-packetsLostPer");
    expect(historyview.videoLostPer.text()).toEqual("avg-video-packetsLostPer");
    expect(historyview.jitter.text()).toEqual("avg-audio-googJitterReceived");
  });
  it('persistCall and toggle and show details and call', function() {
    testUA.connect();
    var destination = "";
    eventbus.on('call', function(e){
      destination = e.destination;
    });
    var callHistoryHidden = false;
    historyview.callHistoryDetails.hide = function(){
      callHistoryHidden = true;
    }
    bdsft_client_instances.history_test.persistCall(createRtcSession("sip:remote1@webrtc.broadsoft.com"));
    historyview.toggle();
    historyview.rows[0].trigger("click");
    historyview.callLink.trigger("click");
    expect(destination).toEqual("remote1", "Should trigger call");
    expect(callHistoryHidden).toEqual(true);
  });
  it('WEBRTC-34 : persistCall and toggle and show details and call with existing call', function() {
    var called = false;
    eventbus.on('call', function(e){
      called = true;
    });
    var callHistoryHidden = false;
    historyview.callHistoryDetails.hide = function(){
      callHistoryHidden = true;
    }
    bdsft_client_instances.history_test.persistCall(createRtcSession("sip:remote1@webrtc.broadsoft.com"));
    testUA.startCall();
    historyview.toggle();
    historyview.rows[0].trigger("click");
    historyview.callLink.trigger("click");
    expect(called).toEqual(true);
    expect(callHistoryHidden).toEqual(true);
  });

  it('persistCall for multiple calls', function() {
    bdsft_client_instances.history_test.persistCall(session1);
    bdsft_client_instances.history_test.persistCall(session2);
    expect(localStorage.length).toEqual(1);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session2) + "~" + getCallCookieValue(session1));
    expect(bdsft_client_instances.history_test.pages(), [getCallCookieValue(session2) + "~" + getCallCookieValue(session1)]);
  });
  it('persistCall for multiple calls and higher than callsPerPage', function() {
    bdsft_client_instances.history_test.callsPerPage = 2;
    bdsft_client_instances.history_test.persistCall(session1);
    bdsft_client_instances.history_test.persistCall(session2);
    bdsft_client_instances.history_test.persistCall(session3);
    expect(localStorage.length).toEqual(2);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session2) + "~" + getCallCookieValue(session1));
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"1"]).toEqual(getCallCookieValue(session3));
    expect(bdsft_client_instances.history_test.pagesAsString(), [getCallCookieValue(session3), getCallCookieValue(session2) + "~" + getCallCookieValue(session1)]);
  });
  it('multiple pages and toggle', function() {
    bdsft_client_instances.history_test.callsPerPage = 2;
    bdsft_client_instances.history_test.persistCall(session1);
    bdsft_client_instances.history_test.persistCall(session2);
    bdsft_client_instances.history_test.persistCall(session3);
    historyview.toggle();
    expect(bdsft_client_instances.history_test.pageNumber).toEqual(0);
    expect(historyview.content.text().indexOf("remote1") === -1).toEqual(true, "Should not contain session1 destination");
    expect(historyview.content.text().indexOf("remote2") !== -1).toEqual(true, "Should contain session2 destination");
    expect(historyview.content.text().indexOf("remote3") !== -1).toEqual(true, "Should contain session3 destination");
    // TODO - add back after checking on forward / backward buttons?
    // expect(bdsft_client_instances.history_test.historyForward.is(":visible")).toEqual( true);
    // expect(bdsft_client_instances.history_test.historyBack.is(":visible")).toEqual( false);
  });

  it('multiple pages, toggle, clear and toggle again', function() {
    bdsft_client_instances.history_test.callsPerPage = 2;
    bdsft_client_instances.history_test.persistCall(session1);
    bdsft_client_instances.history_test.persistCall(session2);
    bdsft_client_instances.history_test.persistCall(session3);
    historyview.toggle();
    expect(bdsft_client_instances.history_test.pageNumber).toEqual(0);
    historyview.historyClear.trigger("click");
    expect(bdsft_client_instances.history_test.pageNumber).toEqual(0);
    expect(historyview.content.text()).toEqual("", "Should not contain content");
    expect(historyview.historyForward.is(":visible")).toEqual(false);
    expect(historyview.historyBack.is(":visible")).toEqual(false);
  });

  // TODO - add back after checking on forward / backward buttons?
  // it('multiple pages and toggle and click forward', function() {
  //   client = create(config)
  //   bdsft_client_instances.history_test.callsPerPage = 2;
  //   bdsft_client_instances.history_test.persistCall(session1);
  //   bdsft_client_instances.history_test.persistCall(session2);
  //   bdsft_client_instances.history_test.persistCall(session3);
  //   bdsft_client_instances.history_test.toggle();
  //   bdsft_client_instances.history_test.historyForward.trigger("click");
  //   expect(bdsft_client_instances.history_test.pageNumber).toEqual( 1);
  //   expect(bdsft_client_instances.history_test.content.text().indexOf("remote1") !== -1, true).toEqual( "Should contain session1 destination");
  //   expect(bdsft_client_instances.history_test.content.text().indexOf("remote2") === -1, true).toEqual( "Should not contain session2 destination");
  //   expect(bdsft_client_instances.history_test.content.text().indexOf("remote3") === -1, true).toEqual( "Should not contain session3 destination");
  //   expect(bdsft_client_instances.history_test.historyForward.is(":visible"), false).toEqual( "Should show forward button");
  //   expect(bdsft_client_instances.history_test.historyBack.is(":visible"), true).toEqual( "Should hide back button");
  // });

  it('persistCall for multiple calls and higher than callsPerPage and pages above maxPages', function() {
    bdsft_client_instances.history_test.callsPerPage = 2;
    bdsft_client_instances.history_test.maxPages = 2;
    bdsft_client_instances.history_test.persistCall(session1);
    bdsft_client_instances.history_test.persistCall(session2);
    bdsft_client_instances.history_test.persistCall(session3);
    bdsft_client_instances.history_test.persistCall(session4);
    bdsft_client_instances.history_test.persistCall(session5);
    expect(localStorage.length).toEqual(2);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session3) + "~" + getCallCookieValue(session2));
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"1"]).toEqual(getCallCookieValue(session5) + "~" + getCallCookieValue(session4));
    expect(bdsft_client_instances.history_test.pagesAsString()).toEqual([
      getCallCookieValue(session5) + "~" + getCallCookieValue(session4), 
      getCallCookieValue(session3) + "~" + getCallCookieValue(session2)
      ]);
  });

  function getCallCookieValue(session) {
    session = session || rtcSession;
    return session.start_time.getTime() + "|" + session.remote_identity.uri + "|up|" + getStatsCookieValue() + "|00:00:00"
  }

  function getStatsCookieValue() {
    return "test-video-googFrameWidthReceivedxtest-video-googFrameHeightReceived|" +
      "test-video-googFrameWidthSentxtest-video-googFrameHeightSent|" +
      "avg-video-kiloBitsReceivedPerSecond|" +
      "avg-video-kiloBitsSentPerSecond|" +
      "avg-video-googFrameRateReceived|" +
      "avg-video-googFrameRateSent|" +
      "avg-audio-packetsLostPer|" +
      "avg-video-packetsLostPer|" +
      "avg-audio-googJitterReceived";
  }

  function createRtcSession(uri) {
    return {
      start_time: new Date(),
      end_time: new Date(),
      remote_identity: {
        uri: (uri || "remote")
      },
      direction: "outgoing"
    }
  }

  function mockStats() {
    stats.getValue = function(type, name) {
      return "test-" + type + "-" + name;
    }
    stats.getAvg = function(type, name) {
      return "avg-" + type + "-" + name;
    }
  }
});