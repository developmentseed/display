function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
}

require('sys').inherits(handler, require('./graphHistogram'));

handler.prototype.label = function() {
    var label = require('./base').prototype.label.call(this);
    label.title = "<div class='unit'></div>" + label.title;
    return label;
};

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row);

    display.histogram_raw = JSON.stringify(this.series(fields[0].value, this.settings));
    return display;
};

module.exports = handler;
