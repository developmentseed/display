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
    value: require('./base'),
};

function load(name) {
    return require('expresslane').app.set('settings')('display')[name] || false;
}

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

function row(req, display, row, rows) {
    var built = {
        id: row.value._id || null,
        type: row.value.type || null,
        fields: [],
    };
    for (var identifier in display) {
        var handler = fieldHandler(req, identifier, display[identifier]);
        if (handler) {
            built.fields.push(handler.build(row, rows));
        }
    }
    return built;
}

function fieldHandler(req, identifier, config, arg1, arg2, arg3) {
    var handlerName = config.type || 'base';
    if (typeof handlers[handlerName] === 'function') {
        return new handlers[handlerName](req, identifier, config, arg1, arg2, arg3);
    }
    return false;
}

function style(req, style, name, rows) {
    var display = typeof name === 'string' ? load(name) : name;
    if (display) {
        var s = new Style(req, style, display);
        var built = {
            _template: __dirname + '/templates/' + style,
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

Style.prototype.labels = function() {
    var built = [];
    for (var identifier in this.handlers) {
        built.push(this.handlers[identifier].label());
    }
    return built;
}

Style.prototype.row = function(row, rows) {
    var built = {
        id: row.value._id || null,
        type: row.value.type || null,
        fields: [],
    };
    for (var identifier in this.handlers) {
        built.fields.push(this.handlers[identifier].build(row, rows));
    }
    return built;
}

module.exports = {
    load: load,
    style: style,
    row: row,
    fieldHandler: fieldHandler,
    util: require('./util'),
    handlers: handlers
};

