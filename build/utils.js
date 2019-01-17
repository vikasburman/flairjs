const fs = require('fs');
const path = require('path');
const del = require('del');

// arguments reader
let readArgs = function() {
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
let errorHandler = (name) => {
  return function (err) {
      console.error('Error in task: ' + name);
      console.error('Error: ' + err.toString());
  };
};
// get folders under given root
let getFolders = (root, excludeRoot) => {
  const _getFolders = () => {
      return fs.readdirSync(root)
          .filter((file) => {
              return fs.statSync(path.join(root, file)).isDirectory();
      });
  }
  if (excludeRoot) {
      return _getFolders();
  } 
  return ['/'].concat(_getFolders());
};
let delAll = (root) => {
  del.sync([root + '/**', '!' + root]);
};

exports.readArgs = readArgs;
exports.errorHandler = errorHandler;
exports.getFolders = getFolders;
exports.delAll = delAll;
