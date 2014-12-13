var Compiler = require(/*"node-compiler"*/"../src/lib/Compiler");
var Path = require("path");
var FS = require("fs");

// We'll load the configuration from the file. Normally. we could just pass the path to the Compiler
var config = JSON.parse(FS.readFileSync(Path.join(__dirname, "config.json"), "utf-8"));

// For this example to work without any manual alterations, the directory needs be modified.
config.directory = Path.join(__dirname, "MyProject");

// Instantiate the Compiler.
var compiler = new Compiler(config, "dev");

compiler.on("compiled", function() { console.log("Compiled"); });
compiler.on("changed", function() { console.log("Changed"); });

compiler.compile();