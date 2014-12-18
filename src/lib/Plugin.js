var Helpers = require("../helpers");
var Target = require("./Target");

var Legitimize = require("legitimize");
var Path = require("path");
var FS = require("fs");

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: Since there a number of different files types the compiler must support, a form of plugin system is
                  used. Targets configured in configuration object will specify particular plugins used to compile
                  files in their directory. All plugins will inherit this base class that will define common methods.
  * @parameters:
    * target [object]  - Reference to an instance of a target class.
    * profile [object] - Pointer to a plugin within the configuration object.
  * @requires:
    * helpers    - Required for the deletion of the target cache and the file causing an error.
    * logger     - Required to centralise how data is logged both to console and disk.
    * legitimize - Used to validate a plugin object defined in the configuration object.
    * path       - Used simply to build a reference to the cache directory.
    * fs         - Used only to remove output files if an error occurs.
  * @todo:
    * Remove the error parsing and simply show whatever message is given.
\* ------------------------------------------------------------------------------------------------------------------ */

function Plugin(target, plugin) {
    var invalid = this.validate(plugin);
    if (invalid) { throw new Error(invalid); }
    var compiler = target.profile.compiler;

    this.target = target;
    this.name = plugin.name;
    this.options = (plugin.options || {});
    this.cacheDirectory = Path.join(compiler.directory, ".cache");

    Logger.debug("Instantiating " + this.name + " plugin with the following options " + JSON.stringify(this.options) + ".");
}

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method is called when a file is either created, changed, or deleted. This is part of the plugin
                  class to allow overwriting of how files are processed.
  * @parameters:
    * reason [string] - Used for rendering purposes and will have a value of either 'created', 'changed', or 'deleted'.
    * path [string]   - The absolute path of the file that has been created, changed, or deleted.
    * stat [object]   - The stat object of the created, changed or deleted file.
\* ------------------------------------------------------------------------------------------------------------------ */
Plugin.prototype.onMonitor = function _onMonitor(reason, path, stat) {
    var profile = this.target.profile;
    var filePattern = this.filePattern;

    if (stat && stat.isDirectory()) { return; }
    if (filePattern && !filePattern.test(path)) { return; }

    Logger.info("File " + reason + ": " + path);
    
    profile.compile();
    profile.compiler.emit("changed");
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method is called when an error has occured with the plugin and used to centralise how these
                  are rendered on screen. This can of course be overwritten for more bespoke plugins. The file and
                  target are removed from cache to trigger a recompile on next compile.
  * @parameters:
    * path [string]    - The absolute path of the file that has triggered the error.
    * e [error|string] - Will likely be an instance of Error but some intergrations will annoyingly return a string.
  * @todo:
    * Revise this method, removing the attempt to parse annoying string errors from intergrations such as node-sass.
      It often incorrectly parses them truncating some of the message. Another solution would be to send a pull
      request to such intergrations to throw more standardised errors.
\* ------------------------------------------------------------------------------------------------------------------ */
Plugin.prototype.error = function _error(path, e) {
    Logger.error("Error compiling via " + this.name + " Plugin:");
    Logger.error("- Message: " + e.message);
    Logger.error("- File: " + path);
    if (e.line) { Logger.error("- Line: " + e.line); }
    if (e.col) { Logger.error("- Column: " + e.col); }
    if (e.col) { Logger.error("- Position: " + e.pos); }

    // Remove both file and target cache entries.
    Helpers.deleteCache(this.target, path);
    Helpers.deleteCache(this.target, this.target.directory);

    var outputPath = this.target.profile.output;
    if (FS.existsSync(outputPath) && !FS.statSync(outputPath).isDirectory()) {
        FS.unlinkSync(outputPath);
    }
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method is used when a file is processed due to expired/non-existant cache entry. It will log the
                  file and the output directory derived from it's profile.
  * @parameters:
    * path [string] - The absolute path of the file being processed.
\* ------------------------------------------------------------------------------------------------------------------ */
Plugin.prototype.log = function(path) {
    var profile = this.target.profile;
    var directory = profile.compiler.directory;
    var output;

    if (profile.concatenate) {
        output = profile.output;
    } else {
        var relativePath = Path.relative(this.target.directory, file.dir);
        output = Path.join(profile.output, relativePath);
    }

    Logger.process(this.name, Path.relative(directory, path), Path.relative(directory, output));
};

Plugin.prototype.validate = new Legitimize({
    name: {
        required: true,
        type: "string",
        error: "'name' property of plugin in configuration object is required and must be a supported plugin."
    },
    options: {
        type: "object",
        error: "'options' property of plugin in configuration object is must be an object."
    }
});

module.exports = Plugin;