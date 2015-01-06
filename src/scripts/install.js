var Exec = require("child_process").exec;
var Readline = require("readline");
var Chalk = require("chalk");
var Path = require("path");
var FS = require("fs");

function IntegrationManger() {
    this.supported = this.getSupported();
    this.interface = Readline.createInterface(process.stdin, process.stdout);
    this.integrations = [];
    this.suggestIndex = -1;

    process.stdin.on("keypress", this.onKeyPress.bind(this));
    this.interface.on("close", this.onClose.bind(this));
    this.interface.on("line", this.onLine.bind(this));
    this.interface.setPrompt("");

    this.getIntegrations();
}

IntegrationManger.prototype.getSupported = function() {
    var pluginsDirectory = Path.join(__dirname, "..", "plugins");
    var pluginFiles = FS.readdirSync(pluginsDirectory);

    return pluginFiles.map(function(pluginFile) {
        return require(Path.join(pluginsDirectory, pluginFile));
    });
};

IntegrationManger.prototype.install = function(integration) {
    if (!integration.dependency) { return; }

    var integrationPackage = integration.dependency;
    var moduleDirectory = Path.join(__dirname, "..", "node_modules");
    var packageName = integrationPackage.split("@")[0];

    try {
        require(moduleDirectory + "/" + integrationPackage.split("@")[0]);
        return;
    } catch (e) {}

    var options = {
        cwd: Path.join(__dirname, "..")
    };

    Exec("npm install " + integrationPackage, options, function(err) {
        if (err) { return console.log(Chalk.red("[ERROR]"), Chalk.white(err)); }

        console.log(Chalk.cyan("[INFO]"), Chalk.white(packageName + " successfully installed."));
    });    
};

IntegrationManger.prototype.getIntegrations = function() {
    console.log("Hints:");
    console.log("- Press tab to cycle through supported integrations.");
    console.log("- An empty input will complete the selection.");

    console.log("\nEnter an integration to install:");
    this.interface.prompt();
};

// Handle when the tab button is clicked to suggest the supported integrations
IntegrationManger.prototype.onKeyPress = function(s, key) {
    var integrations = this.supported.filter(function(supported) {
        for (var i = 0; i < this.integrations.length; i += 1) {
            if (this.integrations[i].title == supported.title) {
                return false;
            }
        }
        return true;
    }, this);

    if (integrations.length && (key && key.name == "tab")) {
        this.suggestIndex = ((this.suggestIndex + 1) % integrations.length);
        suggest(this.interface, integrations[this.suggestIndex].title);
    } else {
        this.suggestIndex = -1;
    }
};

IntegrationManger.prototype.onLine = function(input) {
    if (!input) { return this.interface.close(); }
    
    for (var i = 0; i < this.integrations.length; i += 1) {
        if (this.integrations[i].title.toLowerCase() == input.toLowerCase()) {
            return console.log("Already selected");
        }
    }

    var found = false;
    for (var i = 0; i < this.supported.length; i += 1) {
        var integration = this.supported[i];
        if (integration.title.toLowerCase() == input.toLowerCase()) {
            this.integrations.push(integration);
            return;
        }
    }

    if (!found) { console.log("Unsupported integration."); }
};

IntegrationManger.prototype.onClose = function() {
    this.integrations.forEach(function(integration) {
        this.install(integration);
    }, this);
};

function suggest(interface, integration) {
    interface._deleteLineLeft();
    interface._deleteLineRight();
    interface.write(integration);
}

new IntegrationManger();