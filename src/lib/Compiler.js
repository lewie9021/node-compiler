var Profile = require("./Profile");

var Events = require("events");
var Util = require("util");
var Path = require("path");
var FS = require("fs");

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This class is in charge of the initial parsing the configuration object. Many of the properties
                  specified at the root of the object will become properties of the Compiler. Properties such as
                  profiles and modes will require additional processing than just simply referencing. Upon
                  instantiation, the mode specified is mapped to a matching mode documented within the configuration
                  object. This mode will dictate what profiles should be used during runtime. These profiles will be
                  iterated through creating new instances of the Profile class passing on the task of parsing.
                  This subsequently creates a cascading hierarchy of instances that handle particular sections of
                  compiler’s processing logic.
  * @parameters:
    * config [object|string] - The raw configuration object itself or optionally a string can be passed that is 
                               assumed to be a path where the configuration object is stored and should be JSON.
    * mode [string]          - The configuration object should contain an array of modes that map to configured
                               profiles. This parameter will map to the id of a configured mode.
    * debug [boolean]:       - This optional parameter specifies if the compiler should be a debugging state. 
                               Currently this means debugging logs will show up in console.
  * @requires:
    * Logger  - Required to centralise how data is logged both to console and disk.
    * Profile - Used during the instantiation of the Compiler when iterating through the configured profiles.
    * path    - Needed simply to build the cache directory path.
    * fs      - Required if a path is given for the config parameter upon instantiation. It may also be used to
                create the cache directory provided it doesn't already exist.
  * @todo:
    * Ensure the directory path specifed in the configuration exists.
    * When parsing the config from a file, check the path for existances before wrapping it within a try-catch.
    * Validate the configuration more thoroughly to prevent no existant property errors.
\* ------------------------------------------------------------------------------------------------------------------ */

function Compiler(config, mode, debug) {
    this.debug = (debug || false);

    // Call the Logger class and assign global scope.
    Logger = new (require("./Logger"))(this.debug);

    // Load a configuration object from a JSON file or simply pass an object literal.
    config = (typeof config === "string") ? JSON.parse(FS.readFileSync(config, "utf-8")) : config;

    this.mode = config.modes.filter(function(m) { return m.id == mode; })[0];
    if (!this.mode) { return Logger.error("Failed to find the mode '" + mode + "'."); }

    Events.EventEmitter.call(this);
    this.init(config);
}

Util.inherits(Compiler, Events.EventEmitter);

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method simply splits out some of the parsing logic from the main constructor. The cache
                  directory will be created if it doesn't exist before iterating through the selected mode's profiles.
  * @parameters:
    * config [object] - This parameter is passed in via the constructor and provides access to important properties
                        that either require referencing or further processing.
\* ------------------------------------------------------------------------------------------------------------------ */
Compiler.prototype.init = function _init(config) {
    Logger.silent("------------ Starting Compiler ------------");
    Logger.debug("Initialising " + this.mode.name + " mode...");

    this.name = config.name;
    this.directory = config.directory;

    var cacheDirectory = Path.join(this.directory, ".cache");
    if (!FS.existsSync(cacheDirectory)) { 
        Logger.debug("Cache directory doesn't exist, creating...");
        FS.mkdirSync(cacheDirectory);
    }

    this.profiles = [];
    this.mode.profiles.forEach(function(profileID) {
        var profile = config.profiles.filter(function(p) { return p.id == profileID; })[0];
        if (!profile) { return Logger.warn("Invalid profile ID specified '" + profileID + "'."); }
        this.profiles.push(new Profile(this, profile));
    }, this);
};

Compiler.prototype.compile = function _compile() {
    this.profiles.forEach(function(profile) {
        profile.compile(true);
    });

    this.emit("compiled");
};


module.exports = Compiler;