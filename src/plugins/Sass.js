var Helpers = require("../helpers");
var Plugin = require("../lib/Plugin");

var NodeSass = require("node-sass");
var Path = require("path");
var FS = require("fs");

function Sass() {
    this.filePattern = /\.(scss|css)$/i;
    this.outputExtension = ".css";
    Plugin.apply(this, arguments);
}

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: The Sass plugin supports a number of options. Files placed in the watch directory with .scss or 
                  .css extensions are compiled with the node-sass module ouputing compiled css.
  * @options:
    * paths        - Include absolute paths of the compiled files within the output as comments.
    * precision    - Determines how many digits after the decimal will be allowed.
    * outputStyle  - Specifies how the final CSS should be rendered.
    * includePaths - A string or array for which @import'ed files are searched for.
  * @requires:
    * helpers   - Used for reading from and writing to cache.
    * plugin    - Used to inherit common methods among the plugins.
    * node-sass - Used to compile scss files to css.
    * path      - Used to parse base names and extensions of files.
    * fs        - Used to read the contents of the files that aren't within cache when compiling.
  * @todo:
    * Remove the parsing of the error string. It's too inconsistant to be worth truncating error information.
\* ------------------------------------------------------------------------------------------------------------------ */

Sass.prototype = Object.create(Plugin.prototype);
Sass.prototype.constructor = Sass;

Sass.title = "Sass";
Sass.dependency = "node-sass@1.2.3";

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method is called when a file is either created, changed, or deleted. Unlike the generic 
                  behaviour of this method found in the Plugin class, this overwrite will run through the files within
                  the target directory removing any scss or css files. This forces a recompile  to ensure the change
                  is applied.
  * @parameters:
    * reason [string] - Used for rendering purposes and will have a value of either 'created', 'changed', or 'deleted'.
    * path [string]   - The absolute path of the file that have been created, changed, or deleted.
    * stat [object]   - The stat object of the created, changed or deleted file.
  * @todo:
    * Don't remove css files from cache. They wouldn't support the @import functionality.
\* ------------------------------------------------------------------------------------------------------------------ */
Sass.prototype.onMonitor = function _onMonitor(reason, path, stat) {
    var profile = this.target.profile;
    var filePattern = this.filePattern;
    
    if ((stat && stat.isDirectory()) || (filePattern && !filePattern.test(path))) { return; }

    this.logger.info("File " + reason + ": " + Path.relative(profile.compiler.directory, path));

    var filename = Path.basename(path);
    if (filename[0] == "_" && Path.extname(filename) == ".scss") {
        // Remove all main css and scss files from cache;
        var files = Helpers.diveSync(this.target.directory, this.target.filter.bind(this.target));

        files.forEach(function(file) {
            if (Path.basename(file.dir)[0] != "_") {
                var cachePath = Helpers.getCachePath(this.target, file.dir);
                if (FS.existsSync(cachePath)) { FS.unlinkSync(cachePath); }
            }
        }, this);
    }

    profile.compile();
    profile.compiler.emit("changed");
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method first checks the cache for the particular file. If it's not fresh or found, the file
                  will be compiled using the node-sass module and saved in cache. This process is wrapped in a 
                  try-catch to report any errors that may occur during the compile process.
  * @parameters:
    * path [string]     - The absolute path of the file.
    * stat [object]     - The stat object of the file.
    * startup [boolean] - This parameter is only true when the compiler is first launched otherwise it's falsy.
  * @returns: The contents of the compiled file will be returned unless an error occurs. If this is the case null will
              instead be returned.
\* ------------------------------------------------------------------------------------------------------------------ */
Sass.prototype.compile = function _compile(path, stat, startup) {
    if (Path.basename(path)[0] == "_") { return ""; }   

    var cache = Helpers.getCache(this.target, path);
    var profile = this.target.profile;
    var contents = (cache || "");
    var options = this.options;

    if (!cache) {
        try {
            contents = NodeSass.renderSync({
                file: path,
                precision: options.precision,
                outputStyle: options.outputStyle,
                includePaths: (options.includePaths || profile.targets.map(function(target) {
                    return target.directory;
                }))
            });

            if (options.paths) { contents = (("/* " + path + " */\n") + contents); }
            Helpers.cache(this.target, path, contents);
            this.logger.debug("[Cached] " + path);
            this.log(path);
        } catch (e) {
            this.error(path, e);
            return null;
        }
    }

    return contents;
};

module.exports = Sass;