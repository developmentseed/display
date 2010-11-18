function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row);

    display.title = fields[0].value;
    if ((fields.length > 1 || this.settings.args) && fields.length === this.config.fields.length) {
        var href = [];
        if (this.settings.args) {
            for (var i = 0; i < this.settings.args.length; i++) {
                // Args using format :arg are parsed and interpreted as
                // references to req params.
                if (this.settings.args[i].substr(0, 1) === ':') {
                    href.push(this.req.param(this.settings.args[i].substr(1)));
                }
                else {
                    href.push(this.settings.args[i]);
                }
            }
        }
        for (var i = 1; i < fields.length; i++) {
            href.push(fields[i].value);
        }
        display.href = '/' + href.join('/');
    }
    return display;
};

module.exports = handler;

