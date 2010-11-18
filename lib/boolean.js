function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
    this.settings.true = this.settings.true || 'True';
    this.settings.false = this.settings.false || 'False';
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row);

    display.value = fields[0].value == 'Yes' ? this.settings.true : this.settings.false;
    display.bool = fields[0].value == 'Yes' ? 'true' : 'false';
    return display;
};

module.exports = handler;
