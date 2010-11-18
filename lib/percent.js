var util = require('./util');

function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row);
    if (fields.length === 1 && fields[0].value && this.settings.ofTotal) {
        var totalFields;
        for (var i = 0, l = rows.length; i < l; i++) {
            if (rows[i].value && rows[i].value.name === 'Total') {
                totalFields = this.getFields(rows[i]);
                break;
            }
        }
        if (totalFields) {
            display.value = util.percent(fields[0].value, totalFields[0].value);
            if (this.settings.showRaw) {
                display.raw = {
                    numerator: util.ac(fields[0].value),
                    denominator: util.ac(totalFields[0].value)
                };
            }
        }
        return display;
    }
    if (fields.length === 2 && fields[0].value && fields[1].value) {
        display.value = util.percent(fields[0].value, fields[1].value);
        if (this.settings.showRaw) {
            display.raw = {
                numerator: util.ac(fields[0].value),
                denominator: util.ac(fields[1].value)
            };
        }
        return display;
    }
    return this.displayEmpty();
};

module.exports = handler;
