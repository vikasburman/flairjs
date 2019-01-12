const fs = require('fs');
const packageJSON = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// do
const doTask = (done) => {
    // bump version
    let ver = packageJSON.version.split('.');
    ver[0] = parseInt(ver[0]);
    ver[1] = parseInt(ver[1]);
    ver[2] = parseInt(ver[2]);
    if (ver[2] >= 99999) {
        ver[2] = 0
        if (ver[1] >= 999) {
            ver[1] = 0
            ver[0] += 1
        } else {
            ver[1] += 1
        }
    } else {
        ver[2] += 1
    }
    let newVer = ver[0].toString() + '.' + ver[1].toString() + '.' + ver[2].toString();
    console.log('Bumped: ' + packageJSON.version + ' -> ' + newVer);
    packageJSON.version = newVer;
    fs.writeFileSync('./package.json', JSON.stringify(packageJSON, null, 4), 'utf8');

    // done
    done();
};
exports.bump = function(cb) {
    doTask(cb);
};