// define logging ui
document.append('<div id="demo"><ul style="list-style: none;"><li v-for="line in log">{{ line }}</li></ul></div>');

// define logging bucket
let viewlog = [];

// logger function
const logger = function(msg, addBreak) {
  if (addBreak) { viewlog.push(''); }
	viewlog.push(msg);
}

// data binding
new Vue({
    el: '#demo',
    data: {
        log: viewlog
    }
});
