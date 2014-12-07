#!/usr/bin/env node

function parse(arguments, commands) {
	var pattern = /^\-\-\w+/;
	var command = null;
	var params = {};

	// Round up all the command pairs into an object.
	arguments.forEach(function(argument) {
		if (pattern.test(argument)) {
			var name = argument.substr(2);
			if (command = commands.filter(function(c) { return (c.name == name); })[0]) {
				params[name] = ((command.type == "boolean") ? true : command.default);
			}
		} else {
			if (command) {
				params[command.name] = argument;
			}
		}
	});

	// Check to ensure required paramters have been specified and fill in any default values.
	commands.forEach(function(command) {
		if (command.required) {
			var found = false;
			for (var param in params) {
				if (command.name == param) {
					found = true;
					break;
				}
			}

			if (!found) {
				throw new Error(command.name + " is a required parameter.");
			}
		}

		params[command.name] = (params[command.name] || command.default);
	});

	return params;
}

var Compiler = require("../lib/Compiler");
var params = parse(process.argv.slice(2), [
	{
		name: "config",
		required: true,
		type: "string"
	},
	{
		name: "mode",
		required: true,
		type: "string"
	},
	{
		name: "debug",
		default: false,
		type: "boolean"
	}
]);

new Compiler(params.config, params.mode, params.debug);