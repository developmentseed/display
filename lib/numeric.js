/**
 * settings:
 * - includeEmpty: true | false
 *   If this option is true, fields that are specified in the settings but
 *   undefined will still be returned.
 * - emptyText: {string}
 *   This text will be used in the event that a value is undefined.
 */

function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row, this.settings.includeEmpty);
    for (var i = 0, l = fields.length; i < l; i++) {
        var field = fields[i];
        if (typeof field.value === 'undefined') {
            field.value = this.settings.emptyText;
        }
        display.sort = display.sort || field.value;
        display.values.push(this.settings.commas ? require('./util').ac(field.value) : field.value);
    };
    display.values = display.values.join(this.settings.separator);
    return display;
};

handler.prototype.display = function() {
    var label = require('./base').prototype.display.call(this);
    // Use the same template as the 'value' handler
    label._template = __dirname + '/templates/value';
    return label;
};


module.exports = handler;

