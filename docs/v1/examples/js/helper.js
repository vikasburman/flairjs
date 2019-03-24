let viewlog = [];
const logger = function(msg, addBreak) {
  if (addBreak) { viewlog.push(''); }
	viewlog.push(msg);
}

const showLog = function(el) {
    new Vue({
        el: el,
        data: {
            log: viewlog
        }
    });
};