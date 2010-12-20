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

    for (var i = 0, l = fields.length; i < l; i++) {
        var field = fields[i];
        display.values.push({
            value: field.value == 'Yes' ? this.settings.true : this.settings.false,
            bool: field.value == 'Yes' ? 'true' : 'false',
            index: i
        });
    }
    return display;
};

module.exports = handler;
