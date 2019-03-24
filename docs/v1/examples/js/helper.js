// define logging ui
let el = document.createElement('div');
el.id = 'demo';
el.innerHTML = '<ul style="list-style: none;"><li v-for="line in log">{{ line }}</li></ul>';
document.firstElementChild.append(el)

// define logging bucket
let viewlog = [];

// logger function
const logger = function(msg, addBreak) {
  if (addBreak) { viewlog.push('\t'); }
	viewlog.push(msg);
}

// data binding
new Vue({
    el: '#demo',
    data: {
        log: viewlog
    }
});
