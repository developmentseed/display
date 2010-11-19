function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row, false);
    for (var i = 0, l = fields.length; i < l; i++) {
        var field = fields[i];
        display.sort = display.sort || field.value;
        display.values.push(this.settings.commas ? require('./util').ac(field.value) : field.value);
    };
    return display;
};

handler.prototype.display = function() {
    var label = require('./base').prototype.display.call(this);
    // Use the same template as the 'value' handler
    label._template = __dirname + '/templates/value';
    return label;
};


module.exports = handler;

