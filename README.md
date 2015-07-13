# History

Displays the local call history. All calls are persisted in a localStorage key with prefix bdsft_webrtc_page_.

Model : bdsft_webrtc.default.history
View : bdsft_webrtc.default.historyview
Dependencies : [Call Control](../callcontrol), [Messages](../messages), [SIP Stack](../sipstack), [Sound](../sound), [Stats](../stats)

## Elements
<a name="elements"></a>

Element       |Type  |Description
--------------|------|-------------------------------------------------------------------
back          |span  |Moves back to the previous history page.
callLink      |span  |Closes the history view.
clear         |span  |Clears all history pages.
content       |div   |Displays all the calls for the selected history page.
detailsClose  |span  |Closes the history details view.
forward       |span  |Moves forward to the next history page.
statsHolder   |div   |Holds the stats view displayed in the history details for a call.

## Properties
<a name="properties"></a>

Property          |Type              |Description
------------------|------------------|-------------------------------------------------------------------------------------------------------------------------
calls             |array of objects  |Objects contain stats, destination, direction, length and date of the call
callsPerPage      |integer           |The maximum calls that can be listed on one page. (default : 4)
isBackEnabled     |boolean           |True if pageNumber is greater than 0.
isForwardEnabled  |boolean           |True if pageNumber is less than the total page count of calls.
maxPages          |integer           |The maximum pages that can be displayed in the history. If limit is reached oldest call will be removed. (default : 10)
pageNumber        |integer           |The current visible page number of the history

## Configuration
<a name="configuration"></a>

Property           |Type     |Default  |Description
-------------------|---------|---------|----------------------------------
enableCallHistory  |boolean  |true     |True if call history is enabled.

## Methods
<a name="methods"></a>

Method      |Parameters  |Description
------------|------------|------------------------------------------------------------------
back()      |            |Decreases pageNumber by one and thus displays the previous page.
clear()     |            |Delete all calls from history and local storage.
forward()   |            |Increases pageNumber by one and thus displays the next page.
lastCall()  |            |Returns the last call of the call history.

# HistoryRow

Displays a history row for a call.

## Elements
<a name="history_row_view_elements"></a>

Element      |Type  |Description
-------------|------|---------------------------------------
date         |span  |Displays the date of the call.
destination  |a     |Displays the destination of the call.
direction    |span  |Displays the direction of the call.
length       |span  |Displays the length of the call.
