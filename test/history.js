var jsdom = require('mocha-jsdom');
expect = require('expect');
jsdom({});

describe('history', function() {

  before(function(){
    core = require('webrtc-core');
    testUA = core.testUA;
    testUA.setupLocalStorage();
    testUA.createCore('sipstack');
    testUA.createModelAndView('history', {history: require('../'), 
      stats: require('webrtc-stats'),
      callcontrol: require('webrtc-callcontrol'),
      messages: require('webrtc-messages')
    });
    statsview = bdsft_client_instances.test.statsview;
    stats = bdsft_client_instances.test.stats;
    callcontrol = bdsft_client_instances.test.callcontrol;
    testUA.mockWebRTC();
    mockStats();
    rtcSession = testUA.historyRtcSession();
    session1 = testUA.historyRtcSession("remote1")
    session2 = testUA.historyRtcSession("remote2")
    session3 = testUA.historyRtcSession("remote3")
    session4 = testUA.historyRtcSession("remote4")
    session5 = testUA.historyRtcSession("remote5")
  });
  beforeEach(function() {
    localStorage.clear();
    testUA.deleteAllCookies();
  });

  it('persistCall:', function() {
    bdsft_client_instances.test.history.persistCall(rtcSession);
    expect(localStorage.length).toEqual(1);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue());
    expect(bdsft_client_instances.test.history.pagesAsString(), [getCallCookieValue()]);
  });
  it('persistCall and toggle:', function() {
    bdsft_client_instances.test.history.persistCall(rtcSession);
    expect(bdsft_client_instances.test.history.pageNumber).toEqual(0);
    expect(historyview.forward.is(":visible")).toEqual(true);
    expect(historyview.back.is(":visible")).toEqual(true);
    expect(historyview.content.text().indexOf("remote") !== -1).toEqual(true, "Should contain content");
  });

  it('persistCall and toggle and show details', function() {
    bdsft_client_instances.test.history.persistCall(rtcSession);
    historyview.rows[0].view.trigger("click");
    expect(historyview.view.find('.callHistoryDetails').is(":visible")).toEqual(true, "Should show details");
    var keys = require('webrtc-stats').constants.keys;
    for(var i=0; i < keys.length; i++) {
      var key = keys[i];
      expect(statsview[core.utils.camelize('avg '+key)].text()).toEqual("avg-"+key);
    }
  });
  it('persistCall and toggle and show details and call', function() {
    testUA.connect();
    bdsft_client_instances.test.history.persistCall(testUA.historyRtcSession("sip:remote1@webrtc.broadsoft.com"));
    historyview.rows[0].view.trigger("click");
    expect(bdsft_client_instances.test.history.callSelected).toEqual("call-selected-0");
    historyview.callLink.trigger("click");
    expect(callcontrol.destination).toEqual("remote1", "Should trigger call");
    expect(bdsft_client_instances.test.history.callSelected).toEqual(undefined);
  });
  it('WEBRTC-34 : persistCall and toggle and show details and call with existing call', function() {
    bdsft_client_instances.test.history.persistCall(testUA.historyRtcSession("sip:remote1@webrtc.broadsoft.com"));
    testUA.startCall();
    historyview.rows[0].view.trigger("click");
    expect(bdsft_client_instances.test.history.callSelected).toEqual("call-selected-0");
    historyview.callLink.trigger("click");
    expect(callcontrol.destination).toEqual('remote1');
    expect(bdsft_client_instances.test.history.callSelected).toEqual(undefined);
  });

  it('lastCall', function() {
    bdsft_client_instances.test.history.persistCall(session1);
    bdsft_client_instances.test.history.persistCall(session2);
    expect(bdsft_client_instances.test.history.lastCall(), getCallCookieValue(session2));
  });
  it('persistCall for multiple calls', function() {
    bdsft_client_instances.test.history.persistCall(session1);
    bdsft_client_instances.test.history.persistCall(session2);
    expect(localStorage.length).toEqual(1);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session2) + "~" + getCallCookieValue(session1));
    expect(bdsft_client_instances.test.history.pages(), [getCallCookieValue(session2) + "~" + getCallCookieValue(session1)]);
  });
  it('persistCall for multiple calls and higher than callsPerPage', function() {
    bdsft_client_instances.test.history.callsPerPage = 2;
    bdsft_client_instances.test.history.persistCall(session1);
    bdsft_client_instances.test.history.persistCall(session2);
    bdsft_client_instances.test.history.persistCall(session3);
    expect(localStorage.length).toEqual(2);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session2) + "~" + getCallCookieValue(session1));
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"1"]).toEqual(getCallCookieValue(session3));
    expect(bdsft_client_instances.test.history.pagesAsString(), [getCallCookieValue(session3), getCallCookieValue(session2) + "~" + getCallCookieValue(session1)]);
  });
  it('multiple pages and toggle', function() {
    bdsft_client_instances.test.history.callsPerPage = 2;
    bdsft_client_instances.test.history.persistCall(session1);
    bdsft_client_instances.test.history.persistCall(session2);
    bdsft_client_instances.test.history.persistCall(session3);
    expect(bdsft_client_instances.test.history.pageNumber).toEqual(0);
    expect(historyview.content.text().indexOf("remote1") === -1).toEqual(true, "Should not contain session1 destination");
    expect(historyview.content.text().indexOf("remote2") !== -1).toEqual(true, "Should contain session2 destination");
    expect(historyview.content.text().indexOf("remote3") !== -1).toEqual(true, "Should contain session3 destination");
    // TODO - add back after checking on forward / backward buttons?
    // expect(bdsft_client_instances.test.history.forward.is(":visible")).toEqual( true);
    // expect(bdsft_client_instances.test.history.back.is(":visible")).toEqual( false);
  });

  it('multiple pages, toggle, clear and toggle again', function() {
    bdsft_client_instances.test.history.callsPerPage = 2;
    bdsft_client_instances.test.history.persistCall(session1);
    bdsft_client_instances.test.history.persistCall(session2);
    bdsft_client_instances.test.history.persistCall(session3);
    expect(bdsft_client_instances.test.history.pageNumber).toEqual(0);
    historyview.clear.trigger("click");
    expect(bdsft_client_instances.test.history.pageNumber).toEqual(0);
    expect(historyview.content.text()).toEqual("", "Should not contain content");
    expect(historyview.forward.is(":visible")).toEqual(true);
    expect(historyview.back.is(":visible")).toEqual(true);
  });

  // TODO - add back after checking on forward / backward buttons?
  // it('multiple pages and toggle and click forward', function() {
  //   client = create(config)
  //   bdsft_client_instances.test.history.callsPerPage = 2;
  //   bdsft_client_instances.test.history.persistCall(session1);
  //   bdsft_client_instances.test.history.persistCall(session2);
  //   bdsft_client_instances.test.history.persistCall(session3);
  //   bdsft_client_instances.test.history.toggle();
  //   bdsft_client_instances.test.history.forward.trigger("click");
  //   expect(bdsft_client_instances.test.history.pageNumber).toEqual( 1);
  //   expect(bdsft_client_instances.test.history.content.text().indexOf("remote1") !== -1, true).toEqual( "Should contain session1 destination");
  //   expect(bdsft_client_instances.test.history.content.text().indexOf("remote2") === -1, true).toEqual( "Should not contain session2 destination");
  //   expect(bdsft_client_instances.test.history.content.text().indexOf("remote3") === -1, true).toEqual( "Should not contain session3 destination");
  //   expect(bdsft_client_instances.test.history.forward.is(":visible"), false).toEqual( "Should show forward button");
  //   expect(bdsft_client_instances.test.history.back.is(":visible"), true).toEqual( "Should hide back button");
  // });

  it('persistCall for multiple calls and higher than callsPerPage and pages above maxPages', function() {
    bdsft_client_instances.test.history.callsPerPage = 2;
    bdsft_client_instances.test.history.maxPages = 2;
    bdsft_client_instances.test.history.persistCall(session1);
    bdsft_client_instances.test.history.persistCall(session2);
    bdsft_client_instances.test.history.persistCall(session3);
    bdsft_client_instances.test.history.persistCall(session4);
    bdsft_client_instances.test.history.persistCall(session5);
    expect(localStorage.length).toEqual(2);
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session3) + "~" + getCallCookieValue(session2));
    expect(localStorage[core.constants.HISTORY_PAGE_PREFIX+"1"]).toEqual(getCallCookieValue(session5) + "~" + getCallCookieValue(session4));
    expect(bdsft_client_instances.test.history.pagesAsString()).toEqual([
      getCallCookieValue(session5) + "~" + getCallCookieValue(session4), 
      getCallCookieValue(session3) + "~" + getCallCookieValue(session2)
      ]);
  });

  function getCallCookieValue(session) {
    session = session || rtcSession;
    return session.start_time.getTime() + "|" + session.remote_identity.uri + "|up|" + JSON.stringify(stats.getAllAvg()) + "|00:00:00"
  }

  function mockStats() {
    var keys = require('webrtc-stats').constants.keys;
    for(var i=0; i < keys.length; i++) {
      var key = keys[i];
      stats[key] = 'test-'+key;
      stats[core.utils.camelize('avg '+key)] = 'avg-'+key;
    }
  }
});