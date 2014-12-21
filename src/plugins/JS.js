var Helpers = require("../helpers");
var Plugin = require("../lib/Plugin");

var UglifyJS = require("uglify-js");
var Path = require("path");
var FS = require("fs");

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: The JS plugin supports 2 options. Files placed in the watch directory with a .js extension are 
                  processed and potentially compiled with the uglify-js module to minify the output.
  * @options:
    * minify - Triggers the uglify-js module to output the JS in a minifed format.
    * paths  - Include absolute paths of the compiled files within the output as comments.
  * @requires:
    * helpers   - Used for reading from and writing to cache.
    * plugin    - Used to inherit common methods among the plugins.
    * uglify-js - Used to minify the JavaScript if the minify option is specified.
    * fs        - Used to read the contents of the files that aren't within cache and don't require minifying.
\* ------------------------------------------------------------------------------------------------------------------ */

function JS() {
    this.filePattern = /\.js$/i;
    Plugin.apply(this, arguments);
}

JS.prototype = Object.create(Plugin.prototype);
JS.prototype.constructor = JS;

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method first checks the cache for the particular file. If it's not fresh or found, the file 
                  will either be minified or read directly from the file before adding to cache. 
  * @parameters:
    * path: The absolute path of the file.
    * stat: The stat object of the file.
    * startup: This parameter is only true when the compiler is first launched otherwise it's falsy.
  * @returns: The contents of the compiled file will be returned unless an error occurs. If this is the case null will
              instead be returned.
\* ------------------------------------------------------------------------------------------------------------------ */
JS.prototype.compile = function _compile(path, stat, startup) {
    var cache = Helpers.getCache(this.target, path);
    var contents = (cache || "");
    var options = this.options;
    
    if (!cache) {
        try {
            contents = (options.minify) ? UglifyJS.minify(path).code : FS.readFileSync(path, "utf-8");
            if (options.paths) { contents = (("// " + path + "\n") + contents); }
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

module.exports = JS;