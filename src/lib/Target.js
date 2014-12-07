var Helpers = require("../helpers");
var Logger = require("./Logger");

var Chokidar = require("chokidar");
var Path = require("path");
var FS = require("fs-extra");

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This class is contained by an instance of Profile. It's responsible for watching directories. A 
                  Target also spawns an instance of a particular Plugin. When a file is added, deleted, or changed in 
                  the watched directory, its containing Profile will be notified causing the file to be recompiled,
                  cached, and outputted.
  * @parameters:
    * profile [object] - Reference to an instance of a profile class.
    * target [object]  - Pointer to a target within the configuration object.
    * id [integer]     - An index integer assigned during initial iteration of it's profile's targets.
  * @requires:
    * helpers  - Used to retrieve cache files and dive directories.
    * logger   - Required to centralise how data is logged both to console and disk.
    * chokidar - Directory monitoring
    * path     - Used for a number of it's functions, particularly for joining paths.
    * fs-extra - Chosen over the standard fs module for mkdirsSync and used mainly for reading and writing of data.
  * @todo:
    * Watch .order files for changes. When these are updated, and concat is true, a recompile of the profile is
      required to account for the new ordering.
    * Improve the flow of logic and clean up code.
    * Revise (and attempt to reduce) the amount of bespoke functions.
\* ------------------------------------------------------------------------------------------------------------------ */

function Target(profile, target, id) {
    var compiler = profile.compiler;

    this.profile = profile;
    this.plugin = target.plugin;
    this.directory = Path.join(compiler.directory, target.directory);
    this.watch = (target.watch || false);
    this.ignore = (target.ignore || []);
    this.id = id;

    Logger.set("debugging", compiler.debug);

    this.init();
}

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method is used to ensure that the configuration object is valid by making basic checks to
                  prevent the Target from acting strangly and potentially throwing errors. If the checks pass, the
                  plugin will be instantiated and if set, the directory specified will be watched.
\* ------------------------------------------------------------------------------------------------------------------ */
Target.prototype.init = function _init() {
    if (!this.plugin) {
        return Logger.warn("Target plugin for profile '" + this.profile.name + "' ('" + this.directory + "') required.");
    }

    if (!FS.existsSync(this.directory)) {
        return Logger.warn("Target directory for profile '" + this.profile.name + "' ('" + this.directory + "') doesn't exist.");
    }

    var plugins = this.getInstalledPlugins();
    if (plugins.indexOf(this.plugin.name.toLowerCase()) == -1) {
        return Logger.warn("Target plugin for profile '" + this.profile.name + "' ('" + this.directory + "') is invalid.");
    }

    var Module = require(Path.join(__dirname, "../plugins", this.plugin.name));
    this.plugin = new Module(this, this.plugin);

    var integrityPath = Helpers.getCachePath(this, this.directory, false, ".integrity");
    this.integrity = (FS.existsSync(integrityPath) ? FS.readFileSync(integrityPath, "utf-8").split("\r\n") : null);

    if (this.watch) { this.watchDirectory(); }
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method helps bind the context of 'this' much easier than during the delcariation of an object.
                  It is executed for each file/folder within the directory it is watching.
\* ------------------------------------------------------------------------------------------------------------------ */
Target.prototype.filter = function _filter(f, stat) {
    if (stat && stat.isDirectory()) { return true; }

    // Check it matches the file path of the plugin.
    var filePattern = this.plugin.filePattern;
    if (filePattern && !filePattern.test(f)) { return false; }

    // Check it's not a file we want to ignore.
    return !this.ignore.some(function(file) {
        return (f == Path.join(this.directory, file));
    }, this);
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method performs the watching of the directory making use of the filter method. Using the
                  Chokidar module, filtered files within the specified Target directory will be watched for creation,
                  deletion, or modification. If the module emmits any of these events a recompile will be made.
\* ------------------------------------------------------------------------------------------------------------------ */
Target.prototype.watchDirectory = function _watchDirectory() {
    var self = this;
    var watcher = Chokidar.watch(this.directory, {
        ignored: !this.filter.bind(this),
        ignorePermissionErrors: true,
        persistent: true,
        interval: 150
    });

    watcher.on("ready", function() {
        watcher.on("add", self.plugin.onMonitor.bind(self.plugin, "created"));
        watcher.on("change", self.plugin.onMonitor.bind(self.plugin, "changed"));
        watcher.on("unlink", self.plugin.onMonitor.bind(self.plugin, "removed"));

        Logger.debug("[Watching] " + self.directory);
    });
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: Reads the plugins directory and builds up an array of plugins that can be utilised by the compiler.
  * @returns: An array of valid plugins that can be used with the compiler
  * @todo:
    * Remove the need to filter the base class (it's now Plugin and in a different directory).
\* ------------------------------------------------------------------------------------------------------------------ */
Target.prototype.getInstalledPlugins = function _getInstalledPlugins() {
    var plugins = [];

    FS.readdirSync(Path.join(__dirname, "../plugins")).forEach(function(plugin) {
        var p = Path.basename(plugin.toLowerCase(), ".js");
        if (Path.extname(plugin) == ".js" && p !== "base") {
            plugins.push(p);
        }
    });

    return plugins;
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: The function is used to compare two arrays. It first compares lengths before cross checking
                  placement and values.
  * @returns: An object containing the keys changed, created, and deleted. Changed is a boolean value followed by
              created and deleted as arrays containg paths.
\* ------------------------------------------------------------------------------------------------------------------ */
function diffIntegrity(a, b) {
    a = (a || []);
    b = (b || []);

    var changed = (a.length != b.length);
    var created = [];
    var deleted = [];

    a.forEach(function(x, i) {
        if (x != b[i]) { changed = true; }
        if (b.indexOf(x) == -1) { deleted.push(x); }
    });

    b.forEach(function(x, i) {
        if (a.indexOf(x) == -1) { created.push(x); }
    });

    return {
        changed: changed,
        created: created,
        deleted: deleted
    };
}

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This method is called either on startup or when a file is created, changed, or deleted.
  * @parameters:
    * startup [boolean] - This parameter is only true when the compiler is first launched otherwise it's falsy.
\* ------------------------------------------------------------------------------------------------------------------ */
Target.prototype.compile = function _compile(startup) {
    var files = Helpers.diveSync(this.directory, this.filter.bind(this));
    var newIntegrity = files.map(function(f) { return f.dir; });
    var diff = diffIntegrity(this.integrity, newIntegrity);

    this.integrity = (startup ? (this.integrity || newIntegrity) : newIntegrity);

    // If the integrity has changed, update it within cache.
    if (diff.changed) {
        var integrityPath = Helpers.getCachePath(this, this.directory, false, ".integrity");

        FS.mkdirsSync(Path.dirname(integrityPath));
        FS.writeFileSync(integrityPath, this.integrity.join("\r\n"));
        Logger.debug("[Updated] integrity differences detected!");
    }

    // Remove files from cache that have been deleted. If the profile isn't in concatenation mode, files will
    // also be removed from the output directory. TODO: Remove files from cache that have been deleted during
    // the uptime of compiler. 
    if (diff.deleted.length > 0) {
        diff.deleted.forEach(function(path) {
            var cachePath = Helpers.getCachePath(this, this.directory);
            if (FS.existsSync(cachePath)) {
                FS.unlinkSync(cachePath);
                Logger.debug("Removed " + path + " from cache.");
            }

            if (!this.profile.concatenate) {
                var outputPath = Path.join(this.profile.output, Path.relative(this.directory, path));
                if (FS.existsSync(outputPath)) {
                    FS.unlinkSync(outputPath);
                    Logger.debug("Removed " + path + " from output.");
                }
            }
        }, this);
    }

    if (this.profile.concatenate) {
        this.concatenate(files, startup, diff.changed);
    } else {
        this.processFiles(files, startup);
    }
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: Made use of by the compile and concatenate methods. This method is a hybrid that adapts it's output
                  functionality based on the presence of the appendPath parameter.
  * @parameters:
    * files [array]       - An array passed in via the use of the diveSync helper.
    * startup [boolean]   - This parameter is only true when the compiler is first launched otherwise it's falsy.
    * appendPath [string] - An optional parameter that contains a path which the files will be appended to.
  * @returns: If appendPath is present, a concatenated string of all the files passed otherwise an empty string.
\* ------------------------------------------------------------------------------------------------------------------ */
Target.prototype.processFiles = function _processFiles(files, startup, appendPath) {
    var data = "";

    if (appendPath && !FS.existsSync(appendPath)) {
        FS.mkdirsSync(Path.dirname(appendPath));
        FS.writeFileSync(appendPath, "");
    }

    for (var i = 0; i < files.length; i += 1) {
        var file = files[i];
        var contents = this.plugin.compile(file.dir, FS.statSync(file.dir), startup);

        if (contents && contents.length > 0) {
            if (appendPath) { 
                FS.appendFileSync(appendPath, contents + "\n\n");
                data += (contents + "\n\n");
            } else {
                var relativePath = Path.relative(this.directory, file.dir);
                var filePath = Path.join(this.profile.output, relativePath);

                FS.mkdirsSync(Path.dirname(filePath));
                FS.writeFileSync(filePath, contents);
            }
        }
    }
    
    return data;
}

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: Provided an integrity change hasn't triggered, a search for fresh cache of the target is made. If
                  this is outdated or not found a reconcatenation of the target is made via the processFiles method.
                  If there is at least a file with data within the target, the contents will be outputed.
  * @parameters:
    * files [array]             - An array passed in via the use of the diveSync helper.
    * startup [boolean]         - Only true when the compiler is first launched otherwise falsy.
    * integrityChange [boolean] - If true, this over-rules the check to reconcatenate the target.
  * @todo:
    * This may get moved into the compile method as it's relatively short and used once.
\* ------------------------------------------------------------------------------------------------------------------ */
Target.prototype.concatenate = function _concatenate(files, startup, integrityChange) {
    var cachePath = Helpers.getCachePath(this, this.directory);
    var compile = (integrityChange || checkCache(cachePath, files));
    var contents = (compile ? this.processFiles(files, startup, cachePath) : FS.readFileSync(cachePath, "utf-8"));

    // If contents is empty this be due to an empty cache file or an error occuring during the processing of
    // files within the target directory.
    if (contents.length < 1) { return; }

    Logger.debug("Appending target to output " + this.profile.output);
    FS.appendFileSync(this.profile.output, contents);
};

/* ------------------------------------------------------------------------------------------------------------------ *\
  * @description: This function first checks if the file is within cache. If it's found it will then cross reference
                  with the files array passed to ensure that the cache file's date modified is more or equal to the
                  latest edited file within files.
  * @parameters:
    * path [string] - The path of the file to look for within cache.
    * files [array] - An array passed in via the use of the diveSync helper.
  * @returns: true if the specified path can't be found in cache or is outdated, otherwise false will suggest
              it's fresh.
\* ------------------------------------------------------------------------------------------------------------------ */
function checkCache(path, files) {
    if (FS.existsSync(path)) {
        Logger.debug("Target cache file found.");
        var cacheModified = FS.statSync(path).mtime.getTime();
        var mostRecent = 0;

        files.forEach(function(file) {
            mostRecent = Math.max(file.date.getTime(), mostRecent);
        });

        if (cacheModified >= mostRecent) {
            Logger.debug("Target cache file is fresh.");
            return false;
        }

        Logger.debug("Target requires a re-compile.");
        FS.unlinkSync(path);
    } else {
        Logger.debug("Target cache file not found.");
        FS.mkdirsSync(Path.dirname(path));
    }

    return true;
}

module.exports = Target;