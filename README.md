# node-compiler

This project aims to make compiling single page application much easier. I found it difficult to find a module that supports a number intergrations so I thought I would create my own. The compiler uses JSON to configure its behaviour and can contain multiple modes (useful for enviroments such as dev, test, and live). I plan to make a GUI interface in the future to aid the creation of the JSON strucure. Suggestions for other intergrations are more than welcome!

### Install

```
npm install node-compiler
```

### Command Line Usage

Running the compiler via CLI is relatively simple. First, install the package globally:

```
npm install -g node-compiler
```

This will give you direct access to node-compiler. Below are the currently supported commands:

| Key | Description |
| --- | ----------- |
| config | This is the path to the configuration file. |
| mode | This is the mode ID that is mapped to a mode within the configuration file. |
| debug | If present, the compiler will run in debug mode printing to console  |

```
> node-compiler --config C:\Development\MyProject\config.json --mode dev
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
* In this example project, I have a common folder 'Core' that has all my base code I use for making most of my single page applications and a project specific folder labled 'MyApp'.
* I've defined all the profiles with output file directories (note: this can either be a file or a folder and is relative to the directory specified at the root). This means that all the files compiled will be concatenated into one file. If you wish to alter the order of how the files are compiled, you can add a .order file in the directory. This file will contain new-line seperated file directories.
* The targets contain the directory to compile (note: this directory is relative to the directory specified at the root).
* The plugin section of the targets configure how the files to be compiled. The Intergrations section of this README will list the currently supported plugins along with their options. Options can be specified to tweak the behaviour of the plugin and may vary between plugins.

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
* Create a GitHub wiki to describe how to use the compiler in more detail.
* Intergrate Less, Handlebars, and Jade.

### Changelog
<dl>
    <dt>v0.2.2</dt>
    <dd>
        <ul>
            <li>Fixed a bug when emitting the 'changed' event.</li>
        </ul>
    </dd>
    <dt>v0.2.1</dt>
    <dd>
        <ul>
            <li>Fixed a bug with the CLI interface. Due to the recent update to the compiler, specifically how it's instantiated, the CLI would simply setup the environment but didn't call the compile method.</li>
            <li>Added an additional future improvement.</li>
        </ul>
    </dd>
    <dt>v0.2.0</dt>
    <dd>
        <ul>
            <li>Added the legitimize module to help validate the configuration object.</li>
            <li>Improved error handling. Fatal errors that occur will simply throw rather than trying to ignore them.</li>
        </ul>
    </dd>
    <dt>v0.1.1</dt>
    <dd>
        <ul>
            <li>Remade the Logger module to display messages in a more standard format.</li>
            <li>Globalised the Logger module.</li>
            <li>Added a log method to the Plugin module to centralise how processed files are logged.</li>
            <li>Removed the need to instantiate the Logger module for each class.</li>
        </ul>
    </dd>
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