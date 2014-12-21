#!/usr/bin/env node
var Commander = require("commander");
var Compiler = require("../lib/Compiler");

var params = Commander
    .option('-c, --config <path>', 'Configuration path')
    .option('-m, --mode <id>', 'Compile mode')
    .option('-d, --debug', 'Debug mode')
    .parse(process.argv);

try {
    var compiler = new Compiler(params.config, params.mode, params.debug);
    compiler.on("compiled", function() { console.log("compiled"); });
    compiler.compile();
} catch(e) {
    console.log(e);
}