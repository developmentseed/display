FieldHandler.prototype.percent = function(req, identifier, config, headers, fields, max_fields, total_fields) {
    var settings = config.settings || {};
    var display = this.createDisplay(identifier, config, headers);
    if (fields.length === 1 && fields[0].value && settings.ofTotal) {
        display.value = make_percent(fields[0].value, total_fields[0].value);
        if (settings.showRaw) {
            display.raw = { numerator: ac(fields[0].value), denominator: ac(total_fields[0].value) };
        }
        return display;
    }
    if (fields.length === 2 && fields[0].value && fields[1].value) {
        display.value = make_percent(fields[0].value, fields[1].value);
        if (settings.showRaw) {
            display.raw = { numerator: ac(fields[0].value), denominator: ac(fields[1].value) };
        }
        return display;
    }
    return this.empty(identifier, config, headers);
};

