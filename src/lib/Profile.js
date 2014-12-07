var Logger = require("./Logger");
var Target = require("./Target");

var Path = require("path");
var FS = require("fs-extra")

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This class has authority over the compilation of files within its subsequent target directories. A
                  profile can contain multiple instances of Target that all report to its Profile when a file is
                  either created, deleted, or updated. When this occurs, the profile will authorise a compile of all
                  its targets.
  * @parameters:
    * compiler [object] - Reference to an instance of the compiler class.
    * profile [object]  - Pointer to a profile within the configuration object.
  * @requires:
    * Logger:   - Required to centralise how data is logged both to console and disk.
    * Target:   - Used during the instantiation of the Profile when iterating through the configured targets.
    * path:     - Used to retrieve the directory portion of cache profiles and to determine the concatenation mode.
    * fs-extra: - Chosen over the standard fs module for mkdirsSync and used to remove old output files.
\* ------------------------------------------------------------------------------------------------------------------ */

function Profile(compiler, profile) {
    this.id = profile.id;
    this.name = profile.name;
    this.output = Path.join(compiler.directory, profile.output);
    this.concatenate = (Path.extname(this.output).length > 0);
    this.compiler = compiler;

    Logger.set("debugging", this.compiler.debug);

    this.targets = profile.targets.map(function(target, id) {
        return new Target(this, target, id);
    }, this);

    this.compile(true);
}

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method loops through each target and compiles them. Depending on the output specified, files
                  may be concatinated or saved individually.
  * @parameters:
    * startup [boolean]: This parameter is only true when the compiler is first launched otherwise it's falsy.
\* ------------------------------------------------------------------------------------------------------------------ */
Profile.prototype.compile = function _compile(startup) {
    if (FS.existsSync(this.output)) {
        if (!FS.statSync(this.output).isDirectory()) {
            Logger.debug("Removing old output file.");
            FS.unlinkSync(this.output);
        }
    } else {
        FS.mkdirsSync(Path.dirname(this.output));
    }

    Logger.debug("Compiling Targets for Profile '" + this.name + "'.");
    this.targets.forEach(function(target) { target.compile(startup); });
};

module.exports = Profile;