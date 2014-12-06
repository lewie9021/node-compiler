var Chalk = require("chalk");
var Path = require("path");
var FS = require("fs");

function Logger() {}

Logger.prototype.set = function(key, value) {
    this[key] = value;
};

Logger.prototype.warn = function(text) {
    log(Chalk.yellow, text);
};

Logger.prototype.silent = function(text) {
    log(null, text, false);
}

Logger.prototype.debug = function(text) {
    log(Chalk.magenta, text, this.debugging);
};

Logger.prototype.info = function(text) {
    log(Chalk.gray, text);
};

Logger.prototype.error = function(text) {
    log(Chalk.red, text);
};

Logger.prototype.success = function(text) {
    log(Chalk.green, text);
};

function log(color, text, show) {
    if (show != false) { console.log(color(text)); }

    var logs = Path.join(__dirname, ".logs");
    if (!FS.existsSync(logs)) { FS.mkdirSync(logs); }
    FS.appendFileSync(Path.join(logs, getDate() + ".txt"), getTime() + " " + text + "\n");
};

function getDate() {
    var now = new Date();
    var day = now.getDate();
    var month = (now.getMonth() + 1);
    var year = now.getFullYear();

    return ((day > 9 ? "" : "0") + day) + "-"
         + ((month > 9 ? "" : "0") + month) + "-"
         + ((year > 9 ? "" : "0") + year);
}

function getTime() {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();

    return ((hour > 9 ? "" : "0") + hour) + ":"
         + ((minute > 9 ? "" : "0") + minute) + ":"
         + ((second > 9 ? "" : "0") + second);
}

module.exports = new Logger();