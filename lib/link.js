function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row);

    display.title = fields[0].value;
    if ((fields.length > 1 || this.settings.path) && fields.length === this.config.fields.length) {
        display.href = this.replaceTokens(this.settings.path, row);
    }
    return display;
};

module.exports = handler;

