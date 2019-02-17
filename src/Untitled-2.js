(async () => {
const x = await _include('a');

})();

include([
'a'
], (a) => {

})




$$('import', './somefile.js');
const myTask = Task('myBackgroundTask', function() {
    this.construct = () => {
    };
    this.dispose = () => {
    };

    this.abc1 = (e) => {
    };
});

// transparent sending of messages like
// call funcName
// set propName value
// get propName 
// handle eventName

// Task will return a proxy which will call func or get/set prop in real-time

// 'tinstance' - task instance
// 'task' - task type


abc = function() { onmessage = function(e) { console.log(e); postMessage('hello');  } }
dataObj = '(' + abc + ')();';
blob = new Blob([dataObj.replace('"use strict";', '')]);
blobURL = (window.URL ? URL : webkitURL).createObjectURL(blob, {
    type: 'application/javascript; charset=utf-8'
});
wk = new Worker(blobURL);
wk.onmessage = function(e) { console.log(e); }
wk.postMessage('abc')
>MessageEvent {isTrusted: true, data: "abc", origin: "", lastEventId: "", source: null, …}
>MessageEvent {isTrusted: true, data: "hello", origin: "", lastEventId: "", source: null, …}


abc = function() { this.onmessage = function(e) { console.log(e); postMessage(this[e.data.fname](e.data.data)); }; this.f1 = (data) => { console.log('f1 = ' + data); return data + 1; }; this.f2 = (data) => { console.log('f2 = ' + data); return data + 2; } }


