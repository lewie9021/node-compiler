var Chalk = require("chalk");
var Path = require("path");
var FS = require("fs");

function Logger(debug, directory) {
    this.debugging = debug;
    this.directory = directory;
}

Logger.prototype.log = function(type, message, show) {
    if (show != false) { 
        console.log("%s %s: %s", type.color("[" + type.text + "]"), Chalk.green(getTime()), Chalk.white(message));
    }

    save.call(this, "[" + type.text + "] " + getTime() + ": " + message);
};

Logger.prototype.process = function(plugin, from, to) {
    console.log("%s %s: %s -> %s", Chalk.gray("[" + plugin + "]"), Chalk.green(getTime()), Chalk.white(from), Chalk.white(to));
    save.call(this, "[" + plugin + "] " + getTime() + ": " + from + " -> " + to);
}

Logger.prototype.info = function(message) {
    var type = {color: Chalk.cyan, text: "INFO"};
    this.log(type, message);
};

Logger.prototype.silent = function(message) {
    this.log({text: "SILENT"}, message, false);
};

Logger.prototype.debug = function(message) {
    var type = {color: Chalk.blue, text: "DEBUG"};
    this.log(type, message, this.debugging);
};

Logger.prototype.error = function(message) {
    var type = {color: Chalk.red, text: "ERROR"};
    this.log(type, message);
};

Logger.prototype.warn = function(message) {
    var type = {color: Chalk.yellow, text: "WARN"};
    this.log(type, message);
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

function save(text) {
    var logs = Path.join(this.directory, ".logs");
    
    if (!FS.existsSync(logs)) { FS.mkdirSync(logs); }
    FS.appendFileSync(Path.join(logs, getDate() + ".txt"), text + "\r\n");
}

module.exports = Logger;