var Crypto = require("crypto");
var Path = require("path");
var FS = require("fs-extra");

// This function is used to cache a file once it has been created.
function cache(target, path, data) {
	var cachePath = getCachePath(target, path, true);
	FS.writeFileSync(cachePath, data);
};

// This function first hashes the profile name and uses it as a folder name within the cache directory. A file name made
// up of an object containing the directory and compile options is stringified and hashed to produce a file name.
function getCachePath(target, path, create, extension) {
	var name = hash(target.profile.name);
	var compiler = target.profile.compiler;
	var profileCache = Path.join(compiler.directory, ".cache", name);

	if (create) { FS.mkdirsSync(profileCache); }

	var filename = JSON.stringify({dir: path, options: target.plugin.options});
    var cachePath = Path.join(profileCache, hash(filename) + (extension || ".cache"));
    target.logger.silent("Converted path '" + path + "' to '" + cachePath + "'.");

	return cachePath;
};

// This function is used to return a cache copy of a given file path
function getCache(target, path, encoding) {
    var cachePath = getCachePath(target, path);

    if (FS.existsSync(cachePath) && FS.existsSync(path)) {
        if (compareFileDates(cachePath, path) == cachePath) {
            return FS.readFileSync(cachePath, (typeof encoding !== "undefined" ? encoding : "utf-8"));
        }
        FS.unlinkSync(cachePath);
    }

    return null;
};

function deleteCache(target, path) {
    var cachePath = getCachePath(target, path);
    if (FS.existsSync(cachePath)) {
        FS.unlinkSync(cachePath);
    }
}

function compareFileDates(fileA, fileB) {
    var fileAModified = FS.statSync(fileA).mtime.getTime();
    var fileBModified = FS.statSync(fileB).mtime.getTime();

    return (fileAModified >= fileBModified) ? fileA : fileB;
}

function hash(value) {
    var md5 = Crypto.createHash("md5")
    return md5.update(value).digest("hex");
}

function checkIntegrity(cache, current) {
    if (cache.length != current.length) { return false; }
    for (var i = 0; i < cache.length; i += 1) {
        if (cache[i] != current[i].dir) { return false; }
    }
    return true;
}

function diveSync(dir, filter) {
    // Ensure the directory passed is valid.
    if (!FS.existsSync(dir)) { return []; }

    // Get a list of files and folders within the directory.
    var items = FS.readdirSync(dir);
    var orderItems = (items.indexOf(".order") != -1) ? FS.readFileSync(Path.join(dir, ".order"), "utf-8").split(/\r?\n/) : [];
    var directories = [];

    // loop through each order file cross checking with the items array for validation.
    // If it's already in items, remove it else we assume that it's an invalid path.
    for (var i = orderItems.length - 1; i >= 0; i--) {
        var orderItem = orderItems[i];
        var itemsIndex = items.indexOf(orderItem);

        if (itemsIndex != -1) {
            items.splice(itemsIndex, 1);
        } else {
            orderItems.splice(i, 1);
        }
    }

    // Join the two arrays up with the order files first.
    var files = orderItems.concat(items);

    // Loop through all the files checking if it's a directory. These will later be crawled
    // giving the concept of files in current directory > folders. If the file isn't a directory,
    // validate it against an option filter function. If it doesn't pass, it will be removed.
    for (var i = files.length - 1; i >= 0; i--) {
        var file = files[i];
        var path = Path.join(dir, file);
        var stat = (FS.existsSync(path) ? FS.statSync(path) : null);

        if (stat && stat.isDirectory()) {
            directories.push(path);
            files.splice(i, 1);
        } else {
            if (filter && !filter(path, stat)) {
                files.splice(i, 1);
                continue;
            }

            files[i] = {dir: path, date: ((stat && stat.mtime) || 0)};
        }
    }

    // Loop through each directory to recursivly crawl the rest of the directories passing down
    // the filter function if given.
    directories.forEach(function(directory) {
        files = files.concat(diveSync(directory, filter));
    });

    return files;
}

module.exports.cache = cache;
module.exports.getCachePath = getCachePath;
module.exports.getCache = getCache;
module.exports.deleteCache = deleteCache;
module.exports.compareFileDates = compareFileDates;
module.exports.hash = hash;
module.exports.checkIntegrity = checkIntegrity;
module.exports.diveSync = diveSync;