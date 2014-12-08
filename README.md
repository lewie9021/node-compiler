# node-compiler

This project aims to make compiling single page application much easier. I found it difficult to find a module that supports a number intergrations so I thought I would create my own. The compiler uses JSON to configure its behaviour and can contain multiple modes (useful for enviroments such as dev, test, and live). I plan to make a GUI interface in the future to aid the creation of the JSON strucure. Suggestions for other intergrations are more than welcome!

### Install

```
npm install node-compiler
```

### Quick Start

```javascript
var Compiler = require("node-compiler");
var Path = require("path");

var config = Path.join(__dirname, "config.json");
var compiler = new Compiler(config, "dev");

compiler.on("compiled", function() { console.log("Compiled"); });
compiler.on("changed", function() { console.log("Changed"); });

compiler.compile();
```

The example above requires the module and instantiates it with a path to the configuration file (note: this can instead be an object literal) followed by the mode you wish to use which in this case is development. You can optionally run the compiler in debug mode by specifying an additional parameter of true. For the above example to work however, a configuration file will need to be created:

```json
{
    "name": "My Project",
    "directory": "C:\\Development\\MyProject",
    "modes": [
        {
            "id": "dev",
            "name": "Development",
            "profiles": ["js", "templates", "styling"]
        }
    ],
    "profiles": [
        {
            "id": "js",
            "name": "JavaScript",
            "output": "MyApp\\public\\app.js",
            "targets": [
                {
                    "directory": "Core\\js",
                    "watch": true,
                    "plugin": {
                        "name": "JS",
                        "options": {
                            "minify": false,
                            "paths": true
                        }
                    }
                },
                {
                    "directory": "MyApp\\src\\js",
                    "watch": true,
                    "plugin": {
                        "name": "JS",
                        "options": {
                            "minify": false,
                            "paths": true
                        }
                    }
                }
            ]
        },
        {
            "id": "templates",
            "name": "Dust Templates",
            "output": "MyApp\\public\\dust.js",
            "targets": [
                {
                    "directory": "Core\\dust",
                    "watch": true,
                    "plugin": {
                        "name": "Dust",
                        "options": {
                            "relativePath": true,
                            "paths": true
                        }
                    }
                },
                {
                    "directory": "MyApp\\src\\dust",
                    "watch": true,
                    "plugin": {
                        "name": "Dust",
                        "options": {
                            "relativePath": true,
                            "paths": true
                        }
                    }
                }
            ]
        },
        {
            "id": "styling",
            "name": "Sass Stylesheets",
            "output": "MyApp\\public\\theme.css",
            "targets": [
                {
                    "directory": "Core\\sass",
                    "watch": true,
                    "plugin": {
                        "name": "Sass",
                        "options": {
                            "paths": true
                        }
                    }
                },
                {
                    "directory": "MyApp\\src\\sass",
                    "watch": true,
                    "plugin": {
                        "name": "Sass",
                        "options": {
                            "paths": true
                        }
                    }
                }
            ]
        }
    ]
}
```

The configuration object above may seem daunting however, broken down, it's rather simple:

* The base directory is **C:\Development\MyProject**.
* I've defined a mode **dev**, that will compile the profiles: **js**, **templates**, and **styling**.
* I've declared how I want the profiles to behave found within the profiles array (note: Their IDs match up with the mode profiles I specifed to enable correct linking).
* In this example project, I have a common folder 'Core' that has all my base code I use for making most of my single page applications and a project specify folder labled 'MyApp'.
* The output of all the profiles are paths to files. These can either be a **file** or a **directory** (note: this directory is relative to the directory specified at the root). If a directory is specified, files will be compiled and placed in the directory with a relative path to the source directory. A file output will mean all the compiled code will be concatenated together.
* The targets contain the directory to compile (note: this directory is relative to the directory specified at the root).
* The plugin section of the targets configure how the files to be compiled. The Intergrations section of this README will give you a list of the currently supported plugins. Options can be specified to tweak the behaviour of the plugin and may vary between plugins.

### Intergrations

* Sync
* Dust
    * relativePath
    * paths
* Sass
    * includePaths
    * outputStyle
    * precision
    * paths
* JS
    * minify
    * paths
* Coffee
    * header
    * bare
    * paths

### Future Improvements

* A GUI to make creating the configuration object much more user friendly.
* Better logging implementation.
* Document how to use the command line interface.

### Changelog
<dl>
    <dt>v0.1.0</dt>
    <dd>
        <ul>
            <li>Made use of event emitters for on compile and file changes (modify, create, delete).</li>
            <li>Modified the way the compiler is instantiated due to the previous change. After instantiating the Compiler, you will need to call it's compile method to begin the process. This allows time for event handlers to be attached.</li>
            <li>Fixed some typos within the README and within comments.</li>
            <li>The example now includes the use of event emitters to log on 'compiled' and 'changed'.</li>
        </ul>
    </dd>
    <dt>v0.0.6</dt>
    <dd>
        <ul>
            <li>Added support for CoffeeScript</li>
        </ul>
    </dd>
    <dt>v0.0.5</dt>
    <dd>
        <ul>
            <li>Added support for the command line.</li>
            <li>Added an example (based on the README scenario) to showcase the compiler.</li>
            <li>Fixed some typos within the README.</li>
            <li>Fixed a bug with the Dust plugin. If the relativePath option was specified the template name would contain the file extension.</li>
            <li>Added a log message when a compile is finished.</li>
            <li>Fixed a bug with the Target class using concatenation. Sass partials would return no content as they're ignored. This caused the compiler to drop the accumulated code resulting in missing code in the output file.</li>
            <li>Modifed a couple of logs within Target that were logging as info rather than debug.</li>
        </ul>
    </dd>
</dl>

### Licence
Copyright (c) 2014 Lewis Barnes. See LICENSE for details.