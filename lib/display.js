var handlers = {
    base: require('./base'),
    string: require('./base'),
    float: require('./numeric'),
    integer: require('./numeric'),
    boolean: require('./boolean'),
    graphCompare: require('./graphCompare'),
    graphDivisible: require('./graphDivisible'),
    graphHistogram: require('./graphHistogram'),
    image: require('./image'),
    link: require('./link'),
    numeric: require('./numeric'),
    percent: require('./percent'),
    value: require('./base')
};

var styles = {
    item: __dirname + '/templates/item',
    table: __dirname + '/templates/table'
};

/**
 * @param {string} name of a display configuration to load from settings.
 * @return {object} dispay config.
 */
function load(name) {
    var display = require('expresslane').app.set('settings')('display')[name];
    return display ? JSON.parse(JSON.stringify(display)) : false;
}

/**
 * @param {object} req the request.
 * @param {object} display configuration object.
 * @return {array} list of lables.
 */
function labels(req, display) {
    var built = [];
    for (var identifier in display) {
        var handler = fieldHandler(req, identifier, display[identifier]);
        if (handler) {
            built.push(handler.label());
        }
    }
    return built;
}

/**
 * @param {object} req request object.
 * @param {object} display config.
 * @param {object} row the row to display.
 * @param {array} rows all rows.
 * @return {object} built for // todo be more specific.
 */
function row(req, display, row, rows) {
    var built = {
        id: row.value._id || null,
        type: row.value.type || null,
        fields: []
    };
    for (var identifier in display) {
        var handler = fieldHandler(req, identifier, display[identifier]);
        if (handler) {
            built.fields.push(handler.build(row, rows));
        }
    }
    return built;
}

/**
 * @param {object} req the request.
 * @param {string} identifier the id of the field handler.
 * @param {object} config extra configuration for the handler // todo replace!
 * @param {any} arg1 for the field handler. // todo not sure about arbitrary args..
 * @param {any} arg2 for the field handler.
 * @param {any} arg3 for the field handler.
 * @return ??
 */
function fieldHandler(req, identifier, config, arg1, arg2, arg3) {
    // Expand the schema (should it be "$schema"?) unless it's already done
    if (config.schema && config.property && req.schema[config.schema]) {

        var schema = req.schema[config.schema].properties[config.property] || false;

        // TODO use the standardized names from JSON schema throughout.
        config.title = config.title || schema.name;
        config.help = config.help || schema.description;
        config.fields = config.fields || {};
        // handle 'patternProperties'?
    }

    var handlerName = config.type || 'base';
    if (typeof handlers[handlerName] === 'function') {
        return new handlers[handlerName](req, identifier, config, arg1, arg2, arg3);
    }
    return false;
}

/**
 * @param {object} req the request.
 * @param {string} style either 'table' or 'item'.
 * @param {string|object} name either a style name or a style definition.
 * @param {array} rows items to style.
 * @return {object} ready to render locals.
 */
function style(req, style, name, rows) {
    var display = typeof name === 'string' ? load(name) : name;
    if (display) {
        var s = new Style(req, style, display);
        var built = {
            _template: styles[style],
            labels: s.labels(),
            rows: []
        };
        for (var i = 0, l = rows.length; i < l; i++) {
            built.rows.push(s.row(rows[i], rows));
        }
        return built;
    }
    return false;
}

/**
 * Style constructor
 * @constructor
 * @param {object} req the request object.
 * @param {string} style either 'table' or 'item' // required?
 * @param {object} display definition.
 */
function Style(req, style, display) {
    this.req = req;
    this.style = style;
    this.display = display;
    this.handlers = {};
    for (var identifier in display) {
        var handler = fieldHandler(req, identifier, display[identifier]);
        if (handler) {
            this.handlers[identifier] = handler;
        }
    }
}

/**
 * Retrieve labels for fields.
 * @return {array} list of labels.
 */
Style.prototype.labels = function() {
    var built = [];
    for (var identifier in this.handlers) {
        built.push(this.handlers[identifier].label());
    }
    return built;
};

/**
 * Build rows and run handlers.
 * 
 * @param {object} row the row to display.
 * @param {array} rows all rows.
 * @return {object} built row.
 */
Style.prototype.row = function(row, rows) {
    var built = {
        id: row.value._id || null,
        type: row.value.type || null,
        fields: []
    };
    for (var identifier in this.handlers) {
        built.fields.push(this.handlers[identifier].build(row, rows));
    }
    return built;
};

module.exports = {
    load: load,
    style: style,
    row: row,
    fieldHandler: fieldHandler,
    util: require('./util'),
    handlers: handlers,
    styles: styles
};
