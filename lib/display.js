var handlers = {
    base: require('./base'),
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
        config.fields = config.fields || [{field: config.property}];

        var type = schema.extends && schema.extends.$ref || false;
        // todo not sure about this handler logic.
        config.type = config.type || (handlers[type] ? type : false);
        if (!config.type) {
            switch (schema.type) {
                case 'float':
                case 'integer':
                    config.type = 'numeric';
                    break;
                case 'string':
                    config.type = 'value';
                    break;
            }
        }
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
function style(req, style, name, rows, cb) {
    var display = typeof name === 'string' ? load(name) : name;
    if (display) {
        var s = new Style(req, style, display, cb);
        var built = {
            _template: styles[style],
            labels: s.labels(),
            rows: []
        };
        for (var i = 0, l = rows.length; i < l; i++) {
            built.rows.push(s.row(rows[i], rows));
        }
        cb && cb(built)
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
function Style(req, style, display, cb) {
    this.req = req;
    this.style = style;
    this.display = display;
    this.handlers = {};
    for (var identifier in display) {
        var handler = fieldHandler(req, identifier, display[identifier], cb);
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
    style: style,
    fieldHandler: fieldHandler,
    util: require('./util'),
    handlers: handlers,
    styles: styles
};
