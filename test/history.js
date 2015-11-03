test = require('../node_modules/webrtc-sipstack/test/includes/common')(require('../node_modules/bdsft-sdk-test/lib/common'));
describe('history', function() {

  before(function(){
    core = require('webrtc-core');
    test.setupLocalStorage();
    test.createModelAndView('sipstack', {
      sipstack: require('webrtc-sipstack'),
      eventbus: require('bdsft-sdk-eventbus'),
      debug: require('bdsft-sdk-debug'),
      core: require('webrtc-core')
    });
    test.createModelAndView('history', {history: require('../'), 
      stats: require('webrtc-stats'),
      callcontrol: require('webrtc-callcontrol'),
      messages: require('webrtc-messages'),
      sipstack: require('webrtc-sipstack'),
      sound: require('webrtc-sound'),
      eventbus: require('bdsft-sdk-eventbus'),
      debug: require('bdsft-sdk-debug'),
      core: require('webrtc-core')
    });
    statsview = bdsft_client_instances.test.stats.statsview;
    stats = bdsft_client_instances.test.stats.stats;
    callcontrol = bdsft_client_instances.test.callcontrol.callcontrol;
    mockStats();
    constants = require('../lib/constants');
    rtcSession = test.historyRtcSession();
    session1 = test.historyRtcSession("remote1")
    session2 = test.historyRtcSession("remote2")
    session3 = test.historyRtcSession("remote3")
    session4 = test.historyRtcSession("remote4")
    session5 = test.historyRtcSession("remote5")
  });
  beforeEach(function() {
    localStorage.clear();
    test.deleteAllCookies();
  });

  it('persistCall:', function() {
    bdsft_client_instances.test.history.history.persistCall(rtcSession);
    expect(localStorage.length).toEqual(1);
    expect(localStorage[constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue());
    expect(bdsft_client_instances.test.history.history.pagesAsString(), [getCallCookieValue()]);
  });
  it('persistCall and toggle:', function() {
    bdsft_client_instances.test.history.history.persistCall(rtcSession);
    expect(bdsft_client_instances.test.history.history.pageNumber).toEqual(0);
    expect(historyview.forward.is(":visible")).toEqual(true);
    expect(historyview.back.is(":visible")).toEqual(true);
    expect(historyview.content.text().indexOf("remote") !== -1).toEqual(true, "Should contain content");
  });

  it('persistCall and toggle and show details', function() {
    bdsft_client_instances.test.history.history.persistCall(rtcSession);
    historyview.rows[0].view.trigger("click");
    expect(historyview.view.find('.callHistoryDetails').is(":visible")).toEqual(true, "Should show details");
    var keys = require('webrtc-stats').constants.keys;
    for(var i=0; i < keys.length; i++) {
      var key = keys[i];
      expect(statsview[core.utils.camelize('avg '+key)].text()).toEqual("avg-"+key);
    }
  });
  it('persistCall and toggle and show details and call', function() {
    test.connect();
    bdsft_client_instances.test.history.history.persistCall(test.historyRtcSession("sip:remote1@webrtc.broadsoft.com"));
    historyview.rows[0].view.trigger("click");
    expect(bdsft_client_instances.test.history.history.callSelected).toEqual("call-selected-0");
    historyview.callLink.trigger("click");
    expect(callcontrol.destination).toEqual("remote1", "Should trigger call");
    expect(bdsft_client_instances.test.history.history.callSelected).toEqual(undefined);
  });
  it('WEBRTC-34 : persistCall and toggle and show details and call with existing call', function() {
    bdsft_client_instances.test.history.history.persistCall(test.historyRtcSession("sip:remote1@webrtc.broadsoft.com"));
    test.startCall();
    historyview.rows[0].view.trigger("click");
    expect(bdsft_client_instances.test.history.history.callSelected).toEqual("call-selected-0");
    historyview.callLink.trigger("click");
    expect(callcontrol.destination).toEqual('remote1');
    expect(bdsft_client_instances.test.history.history.callSelected).toEqual(undefined);
  });

  it('lastCall', function() {
    bdsft_client_instances.test.history.history.persistCall(session1);
    bdsft_client_instances.test.history.history.persistCall(session2);
    expect(bdsft_client_instances.test.history.history.lastCall().destination).toEqual(session2.remote_identity.uri);
  });
  it('persistCall for multiple calls', function() {
    bdsft_client_instances.test.history.history.persistCall(session1);
    bdsft_client_instances.test.history.history.persistCall(session2);
    expect(localStorage.length).toEqual(1);
    expect(localStorage[constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session2) + "~" + getCallCookieValue(session1));
    expect(bdsft_client_instances.test.history.history.pages(), [getCallCookieValue(session2) + "~" + getCallCookieValue(session1)]);
  });
  it('persistCall for multiple calls and higher than callsPerPage', function() {
    bdsft_client_instances.test.history.history.callsPerPage = 2;
    bdsft_client_instances.test.history.history.persistCall(session1);
    bdsft_client_instances.test.history.history.persistCall(session2);
    bdsft_client_instances.test.history.history.persistCall(session3);
    expect(localStorage.length).toEqual(2);
    expect(localStorage[constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session2) + "~" + getCallCookieValue(session1));
    expect(localStorage[constants.HISTORY_PAGE_PREFIX+"1"]).toEqual(getCallCookieValue(session3));
    expect(bdsft_client_instances.test.history.history.pagesAsString(), [getCallCookieValue(session3), getCallCookieValue(session2) + "~" + getCallCookieValue(session1)]);
  });
  it('multiple pages and toggle', function() {
    bdsft_client_instances.test.history.history.callsPerPage = 2;
    bdsft_client_instances.test.history.history.persistCall(session1);
    bdsft_client_instances.test.history.history.persistCall(session2);
    bdsft_client_instances.test.history.history.persistCall(session3);
    expect(bdsft_client_instances.test.history.history.pageNumber).toEqual(0);
    expect(historyview.content.text().indexOf("remote1") === -1).toEqual(true, "Should not contain session1 destination");
    expect(historyview.content.text().indexOf("remote2") !== -1).toEqual(true, "Should contain session2 destination");
    expect(historyview.content.text().indexOf("remote3") !== -1).toEqual(true, "Should contain session3 destination");
    // TODO - add back after checking on forward / backward buttons?
    // expect(bdsft_client_instances.test.history.history.forward.is(":visible")).toEqual( true);
    // expect(bdsft_client_instances.test.history.history.back.is(":visible")).toEqual( false);
  });

  it('multiple pages, toggle, clear and toggle again', function() {
    bdsft_client_instances.test.history.history.callsPerPage = 2;
    bdsft_client_instances.test.history.history.persistCall(session1);
    bdsft_client_instances.test.history.history.persistCall(session2);
    bdsft_client_instances.test.history.history.persistCall(session3);
    expect(bdsft_client_instances.test.history.history.pageNumber).toEqual(0);
    historyview.clear.trigger("click");
    expect(bdsft_client_instances.test.history.history.pageNumber).toEqual(0);
    expect(historyview.content.text()).toEqual("", "Should not contain content");
    expect(historyview.forward.is(":visible")).toEqual(true);
    expect(historyview.back.is(":visible")).toEqual(true);
  });

  // TODO - add back after checking on forward / backward buttons?
  // it('multiple pages and toggle and click forward', function() {
  //   client = create(config)
  //   bdsft_client_instances.test.history.history.callsPerPage = 2;
  //   bdsft_client_instances.test.history.history.persistCall(session1);
  //   bdsft_client_instances.test.history.history.persistCall(session2);
  //   bdsft_client_instances.test.history.history.persistCall(session3);
  //   bdsft_client_instances.test.history.history.toggle();
  //   bdsft_client_instances.test.history.history.forward.trigger("click");
  //   expect(bdsft_client_instances.test.history.history.pageNumber).toEqual( 1);
  //   expect(bdsft_client_instances.test.history.history.content.text().indexOf("remote1") !== -1, true).toEqual( "Should contain session1 destination");
  //   expect(bdsft_client_instances.test.history.history.content.text().indexOf("remote2") === -1, true).toEqual( "Should not contain session2 destination");
  //   expect(bdsft_client_instances.test.history.history.content.text().indexOf("remote3") === -1, true).toEqual( "Should not contain session3 destination");
  //   expect(bdsft_client_instances.test.history.history.forward.is(":visible"), false).toEqual( "Should show forward button");
  //   expect(bdsft_client_instances.test.history.history.back.is(":visible"), true).toEqual( "Should hide back button");
  // });

  it('persistCall for multiple calls and higher than callsPerPage and pages above maxPages', function() {
    bdsft_client_instances.test.history.history.callsPerPage = 2;
    bdsft_client_instances.test.history.history.maxPages = 2;
    bdsft_client_instances.test.history.history.persistCall(session1);
    bdsft_client_instances.test.history.history.persistCall(session2);
    bdsft_client_instances.test.history.history.persistCall(session3);
    bdsft_client_instances.test.history.history.persistCall(session4);
    bdsft_client_instances.test.history.history.persistCall(session5);
    expect(localStorage.length).toEqual(2);
    expect(localStorage[constants.HISTORY_PAGE_PREFIX+"0"]).toEqual(getCallCookieValue(session3) + "~" + getCallCookieValue(session2));
    expect(localStorage[constants.HISTORY_PAGE_PREFIX+"1"]).toEqual(getCallCookieValue(session5) + "~" + getCallCookieValue(session4));
    expect(bdsft_client_instances.test.history.history.pagesAsString()).toEqual([
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