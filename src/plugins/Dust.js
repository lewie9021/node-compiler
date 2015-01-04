var Helpers = require("../helpers");
var Plugin = require("../lib/Plugin");

var DustJS = require("dustjs-linkedin");
var Path = require("path");
var FS = require("fs-extra");

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: The Dust plugin supports 2 options. Files placed in the watch directory with a .dust extension are 
                  compiled with the dustjs-linkedin module ouputing the compiled templates to JavaScript.
  * @options:
    * paths        - Include absolute paths of the compiled files within the output as comments.
    * relativePath - Modifies the template name to mirror the directory structure. A template 'test.dust' within 
                     folderA will have the template name1 of 'folderA-test'.
  * @requires:
    * helpers         - Used for reading from and writing to cache.
    * plugin          - Used to inherit common methods among the plugins.
    * dustjs-linkedin - Used to compile the Dust templates into JavaScript.
    * path            - Required to calculate template names.
    * fs              - Used to read the contents of the files that aren't within cache when compiling.
\* ------------------------------------------------------------------------------------------------------------------ */

function Dust() {
    this.filePattern = /\.dust$/i;
    this.outputExtension = ".js";
    Plugin.apply(this, arguments);
}

Dust.prototype = Object.create(Plugin.prototype);
Dust.prototype.constructor = Dust;

Dust.title = "DustJS (LinkedIn)";
Dust.dependency = "dustjs-linkedin@2.5.1";

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method first checks the cache for the particular file. If it's not fresh or found, the file
                  will be compiled using the dustjs-linkedin module and saved in cache. This process is wrapped in a 
                  try-catch to report any errors that may occur during the compile process.
  * @parameters:
    * path [string]     - The absolute path of the file.
    * stat [object]     - The stat object of the file.
    * startup [boolean] - This parameter is only true when the compiler is first launched otherwise it's falsy.
  * @returns: The contents of the compiled file will be returned unless an error occurs. If this is the case null will
              instead be returned.
\* ------------------------------------------------------------------------------------------------------------------ */
Dust.prototype.compile = function _compile(path, stat, startup) {
    var cache = Helpers.getCache(this.target, path);
    var contents = (cache || "");
    var options = this.options;
    
    if (!cache) {
        try {
            var relativePath = Path.relative(this.target.directory, path);
            var templateName = options.relativePath ? relativePath.replace(/\\/g, "-").replace(/\.dust$/i, "") : Path.basename(path, ".dust");

            contents = DustJS.compile(FS.readFileSync(path, "utf-8"), templateName);
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

module.exports = Dust;