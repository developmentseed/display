function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./base'));

handler.prototype.getMax = function(rows) {
    if (typeof this.max === 'undefined') {
        this.max = 0;
        for (var i = 0, l = rows.length; i < l; i++) {
            if (rows[i].value && rows[i].value.type) {
                var fields = this.getFields(rows[i]);
                var total = 0;
                for (var j = 0, m = fields.length; j < m; j++) {
                    total += parseFloat(fields[j].value);
                }
                this.max = (total > this.max) ? total : this.max;
            }
        }
    }
    return this.max;
}

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var crypto = require('crypto');
    var util = require('./util');
    var display = this.display();
    var fields = this.getFields(row);

    var colors = this.settings.colors || ['#666', '#999', '#ccc', '#ddd', '#eee'];
    var colorCache = {};
    var total = 0;
    var offset = 0;

    display.caption = [];

    // Calculate total sum of field values and percents for each field.
    for (var i = 0, l = fields.length; i < l; i++) {
        if (fields[i].value) {
            total += parseInt(fields[i].value, 10);
        }
    }
    for (var i = 0, l = fields.length; i < l; i++) {
        field = fields[i];
        field.pct = util.percent(field.value, total);
        field.offset = offset;
        offset += parseFloat(field.pct);
        // Use first value as sort for display
        if (!display.sort && this.settings.sort) {
            display.sort = field[this.settings.sort];
        }
        field.value = util.ac(field.value);

        if (!colorCache[field.field]) {
            // Generate "unique" value from md5 hash.
            if (this.settings.colorsUnique) {
                hash = crypto.createHash('md5').update(field.field).digest('hex').substr(0, 6);
                colorCache[field.field] = '#' + hash;
            }
            // Just use index from color palette.
            else {
                colorCache[field.field] = colors[i] || '#ddd';
            }
        }

        // Set graph, display and sort values from settings.
        field.graph = {
            graph: field.pct,
            display: field.value,
            sort: field.value,
            color: colorCache[field.field]
        };
        for (var type in field.graph) {
            if (this.settings[type] && field[this.settings[type]]) {
                field.graph[type] = this.settings[type] === 'pct' ? field[this.settings[type]] + '%' : field[this.settings[type]];
            }
        }
        display.values.push(field);
        display.caption.push(field.graph.display);
    }

    // Join caption with separator.
    display.caption = display.caption.join(this.settings.separator);

    // If graph is scaled relative to other rows, calculate max of fields.
    if (this.settings.scale && row.value && row.value.type) {
        display.pct = util.percent(total, this.getMax(rows));
    }
    else {
        display.pct = 100;
    }

    return display;
}

module.exports = handler;
