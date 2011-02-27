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
 * @param {object} schema.
 * @param {string} identifier the id of the field handler.
 * @param {object} config extra configuration for the handler // todo replace!
 * @return ??
 */
function fieldHandler(schema, identifier, config, cb) {
    if (config.property) {
        var propertySchema = schema.properties[config.property] || false;

        // TODO use the standardized names from JSON schema throughout.
        config.title = config.title || propertySchema.name;
        config.help = config.help || propertySchema.description;
        config.fields = config.fields || [{field: config.property}];

        var type = propertySchema.extends && propertySchema.extends.$ref || false;
        // todo not sure about this handler logic.
        config.type = config.type || (handlers[type] ? type : false);
        if (!config.type) {
            switch (propertySchema.type) {
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
        return new handlers[handlerName](schema, identifier, config);
    }
    return false;
}

/**
 * @param {object} schema JSON-schema style description of data.
 * @param {string} style either 'table' or 'item'.
 * @param {string|object} name either a style name or a style definition.
 * @param {array} rows items to style.
 * @return {object} ready to render locals.
 */
function style(schema, style, name, rows, cb) {
    cb = cb || function(built) { return built; };

    var display = typeof name === 'string' ? load(name) : name;
    if (display) {
        var s = new Style(schema, style, display, cb);
        var built = {
            _template: styles[style],
            labels: s.labels(),
            rows: []
        };
        for (var i = 0, l = rows.length; i < l; i++) {
            rows[i]._extraClasses = rows[i]._extraClasses || []
            if (i == 0) {
                rows[i]._extraClasses.push('first');
            }
            else if (i == (rows.length - 1)) {
                rows[i]._extraClasses.push('last');
            }

            built.rows.push(s.row(rows[i], rows, cb));
        }
        return built;
    }
    return false;
}

/**
 * Style constructor
 * TODO: put arguments in better order.
 *
 * @constructor
 * @param {object} schema JSON schema style description of data.
 * @param {string} style either 'table' or 'item' // required?
 * @param {object} display definition.
 */
function Style(schema, style, display, cb) {
    this.schema = schema;
    this.style = style;
    this.display = display;
    this.handlers = {};
    for (var identifier in display) {
        var handler = fieldHandler(schema, identifier, display[identifier], cb);
        if (handler) {
            this.handlers[identifier] = handler;
        }
    }
}

/**
 * Retrieve labels for fields.
 * @return {array} list of labels.
 */
Style.prototype.labels = function(cb) {
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
Style.prototype.row = function(row, rows, cb) {
    var built = {
        id: row.value._id || null,
        type: row.value.type || null,
        fields: []
    };
    for (var identifier in this.handlers) {
        var field = this.handlers[identifier].build(row, rows);
        built.fields.push(cb(field, identifier, row, rows) || field);
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
