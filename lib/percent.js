var util = require('./util');

/**
 * settings:
 * - denominatorField: {field}
 *   if null total of all fields is used
 * - denominatorConditions: {condition: value}
 *   set of conditions that denominator rows should match. If omitted, the
 *   current row is used.
 * - showRaw: true | false
 */

function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row);
    var denominator = 0;
    var denominatorRows = [];

    // Build set of rows that should be used for determining the denominator.
    if (this.settings.denominatorConditions) {
        for (var i = 0; i < rows.length; i++) {
            var match = true;
            for (var key in this.settings.denominatorConditions) {
                if (this.settings.denominatorConditions[key] != rows[i].value[key]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                denominatorRows.push(rows[i]);
            }
        }
    }
    else {
        denominatorRows.push(row);
    }

    // Generate denominator value from denominator rows and specified field.
    for (var i = 0; i < denominatorRows.length; i++) {
        if (this.settings.denominatorField) {
            denominator += this.getFieldValue(denominatorRows[i], this.settings.denominatorField);
        }
        else {
            var denominatorFields = this.getFields(denominatorRows[i]);
            for (var j = 0; j < denominatorFields.length; j++) {
                denominator += denominatorFields[j].value;
            }
        }
    }

    display.values = [];
    for (var i = 0; i < fields.length; i++) {
        display.values.push(util.percent(fields[i].value, denominator) + '%');
    }
    display.values = display.values.join(this.settings.separator);

    // Only show raw value if non-multivalue.
    if (this.settings.showRaw && fields.length === 1) {
        display.caption = [
            util.ac(fields[0].value),
            util.ac(denominator)
        ].join(this.settings.separator);
    }
    return display;
};

module.exports = handler;
