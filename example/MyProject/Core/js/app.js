function App() {
    this.api = "http://www.example.com/api/";
    this.pages = {};
}

App.prototype.render = function(template) {
    console.log("Rendering", template, "template");
};

App.prototype.request = function(resource, query, body) {
    console.log("Making request to", this.api + resource);
    console.log("Query:", query);
    console.log("Body:", body);
}

app = new App();

window.onhashchange = function() {
    app.pages[location.hash.substr(1)]();
}