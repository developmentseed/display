function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    var display = this.display();
    var fields = this.getFields(row);
    if (fields.length === 2) {
        display.value = fields[1].value;
        return display;
    }

    return this.displayEmpty();
};

module.exports = handler;
