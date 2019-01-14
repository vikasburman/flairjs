// arguments reader
const readArgs = function() {
    let argList = process.argv,
        arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {
      thisOpt = argList[a].trim();
      opt = thisOpt.replace(/^\-+/, '');

      if (opt === thisOpt) {
        // argument value
        if (curOpt) arg[curOpt] = opt;
        curOpt = null;
      }
      else {
        // argument name
        curOpt = opt;
        arg[curOpt] = true;
      }
    }
    return arg;
};
// error handler
const errorHandler = (name) => {
  return function (err) {
      console.error('Error in task: ' + name);
      console.error('Error: ' + err.toString());
      console.error(err);
  };
};

exports.readArgs = readArgs;
exports.errorHandler = errorHandler;
