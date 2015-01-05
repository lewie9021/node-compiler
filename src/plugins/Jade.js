var Helpers = require("../helpers");
var Plugin = require("../lib/Plugin");

try { var JadeJS = require("jade"); } catch(e) {}
var Path = require("path");
var FS = require("fs-extra");

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: The Jade plugin supports 2 options. Files placed in the watch directory with a .jade extension are 
                  compiled with the jade module ouputing the compiled templates to JavaScript.
  * @options:
    * paths        - Include absolute paths of the compiled files within the output as comments.
    * relativePath - Modifies the template name to mirror the directory structure. A template 'jade.dust' within 
                     folderA will have the template name1 of 'folderA-test'.
  * @requires:
    * helpers - Used for reading from and writing to cache.
    * plugin  - Used to inherit common methods among the plugins.
    * jade    - Used to compile the Jade templates into JavaScript.
    * path    - Required to calculate template names.
    * fs      - Used to read the contents of the files that aren't within cache when compiling.
\* ------------------------------------------------------------------------------------------------------------------ */

function Jade() {
    this.filePattern = /\.jade$/i;
    this.outputExtension = ".js";
    Plugin.apply(this, arguments);
}

Jade.prototype = Object.create(Plugin.prototype);
Jade.prototype.constructor = Jade;

Jade.title = "Jade";
Jade.dependency = "jade@1.8.2";

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method first checks the cache for the particular file. If it's not fresh or found, the file
                  will be compiled using the jade module and saved in cache. This process is wrapped in a try-catch to
                  report any errors that may occur during the compile process.
  * @parameters:
    * path [string]     - The absolute path of the file.
    * stat [object]     - The stat object of the file.
    * startup [boolean] - This parameter is only true when the compiler is first launched otherwise it's falsy.
  * @returns: The contents of the compiled file will be returned unless an error occurs. If this is the case null will
              instead be returned.
\* ------------------------------------------------------------------------------------------------------------------ */
Jade.prototype.compile = function _compile(path, stat, startup) {
    var cache = Helpers.getCache(this.target, path);
    var contents = (cache || "");
    var options = this.options;
    
    if (!cache) {
        try {
            var relativePath = Path.relative(this.target.directory, path);
            var templateName = options.relativePath ? relativePath.replace(/\\/g, "-").replace(/\.jade$/i, "") : Path.basename(path, ".jade");

            contents = JadeJS.compileClient(FS.readFileSync(path, "utf-8")).replace(/function template/, 'jade.templates["' + templateName + '"] = function');
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

module.exports = Jade;