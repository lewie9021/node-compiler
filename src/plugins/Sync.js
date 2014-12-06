var Helpers = require("../helpers");
var Logger = require("../lib/Logger");
var Plugin = require("../lib/Plugin");

var FS = require("fs");

function Sync() {
    Plugin.apply(this, arguments);

    var compiler = this.target.profile.compiler;
    Logger.set("debugging", compiler.debug);
}

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: The sync plugin is rather simple. Files placed in the watch directory will be copied to the output
                  directory. The filePattern property is not used as unlike other plugins, this isn't important.
  * @requires:
    * helpers - Used for reading from and writing to cache.
    * logger  - Required to centralise how data is logged both to console and disk.
    * plugin  - Used to inherit common methods among the plugins.
    * fs      - Used to read the contents of the files that aren't within cache when compiling.
  * @todo:
    * Force concatination of the target to be false.
    * Skip caching of files and simply check if they are in the output directory.
    * Allow an option to specify a regex file extension matcher.
    * Stream syncing to prevent large amounts of memory consumption when dealing with big files.
\* ------------------------------------------------------------------------------------------------------------------ */

Sync.prototype = Object.create(Plugin.prototype);
Sync.prototype.constructor = Sync;

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method simply checks in cache for the file in question. If this isn't the case the contents of
                  the file is read and created in cache.
  * @parameters:
    * path [string]     - The absolute path of the file.
    * stat [object]     - The stat object of the file.
    * startup [boolean] - This parameter is only true when the compiler is first launched otherwise it's falsy.
  * @returns: The contents of the compiled file will be returned unless an error occurs. If this is the case null will
              instead be returned.
\* ------------------------------------------------------------------------------------------------------------------ */
Sync.prototype.compile = function _compile(path, stat, startup) {
    var cache = Helpers.getCache(this.target, path, null);
    var contents = (cache || "");
    
    if (!cache) {
        contents = FS.readFileSync(path);
        Helpers.cache(this.target, path, contents);
        Logger.debug("[Cached] " + path);
    }

    return contents;
};

module.exports = Sync;