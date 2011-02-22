/**
 * @constructor
 * @param {object} req the request.
 * @param {string} identifier the id of the field.
 * @param {object} config field configuration
 */
function Handler(req, identifier, config) {
    this.req = req;
    this.identifier = identifier;
    this.config = config;
    this.settings = config.settings || {};
    this.settings.separator = this.settings.separator || ' / ';
}

// various display formatters.
var formatters = {
   USD:  function(value) { return '$' + require('./util').ac(value); },
   numeric: function(value) { return require('./util').ac(value); },
   percent: function(value) { return require('./util').percent(value,1) + '%'; },
   rank: function(value) {
       switch (value[value.length - 1]) {
           case '1': return value + 'st';
           case '2': return value + 'nd';
           case '3': return value + 'rd';
           default: return value +'th';
       }
   },
   string: function(value) { return value; },
}

Handler.prototype.formatValue = function(value, format) {
    var format = (format ? format : (this.req.schema ? this.req.schema[this.config.schema].properties[this.config.property].format : 'string'));
    var filtercb = formatters[format] || formatters.string;

    return filtercb(value);
}

Handler.prototype.display = function() {
    var classes = [this.identifier, this.config.type];
    if (this.config.hidden) {
        classes.push('requires-full');
    }
    return {
        _template: __dirname + '/templates/' + this.config.type,
        class: classes.join(' '),
        property: this.config.propery || null,
        schema: this.config.schema || null,
        label: this.label(),
        values: []
    };
};

Handler.prototype.displayEmpty = function() {
    var display = this.display();
    display._template = __dirname + '/templates/empty';
    display.class += ' empty';
    return display;
};

/**
 * @param {object} row the row to build a display for.
 * @param {array} rows all rows.
 * @return {object} a `locals` object
 */
Handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row) || row.value._abstract) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row, false);
    for (var i = 0, l = fields.length; i < l; i++) {
        var field = fields[i];
        display.sort = display.sort || field.value;
        display.values.push(this.formatValue(field.value));
    };
    display.values = display.values.join(this.settings.separator);
    return display;
};

Handler.prototype.isEmpty = function(row) {
    return (this.getFields(row, false).length === 0);
};

/**
 * @param {object} row the to retrieves values for.
 * @param {boolean} includeEmpty whether to return empty values or not.
 * @param {array} an array of values.
 */
Handler.prototype.getFields = function(row, includeEmpty) {
    if (typeof includeEmpty === 'undefined') {
        includeEmpty = false;
    }
    // @TODO: reconsider this type filter.
    if (!this.config.entities || !row.value.type || this.config.entities.indexOf(row.value.type) !== -1) {
        var fields = [];
        for (var i = 0; i < this.config.fields.length; i++) {
            var copy = JSON.parse(JSON.stringify(this.config.fields[i]));
            var value = this.getFieldValue(row, this.config.fields[i].field);
            if (value !== null) {
                copy.value = value;
                fields.push(copy);
            }
            else if (includeEmpty) {
                fields.push(copy);
            }
        }
        return fields;
    }
    return false;
};

Handler.prototype.getFieldValue = function(row, field) {
    var keys = field.split('.');
    var pointer = row.value;
    for (var j = 0; j < keys.length; j++) {
        if (typeof pointer[keys[j]] !== 'undefined') {
            pointer = pointer[keys[j]];
        }
        else {
            pointer = null;
            break;
        }
    }
    if (typeof pointer !== 'undefined' && pointer !== null) {
        return pointer;
    }
    return null;
};

Handler.prototype.label = function() {
    var classes = [this.identifier, this.config.type];
    if (this.config.hidden) {
        classes.push('requires-full');
    }
    return {
        _template: __dirname + '/templates/label',
        title: this.config.title,
        description: this.config.description || null,
        property: this.config.property || null,
        schema: this.config.schema || null,
        help: this.config.help || null,
        class: classes.join(' ')
    }    
};

Handler.prototype.replaceTokens = function(string, row, params) {
    params = params || this.req.params;
    var tokens = [];
    if (params) {
        for (var key in params) {
            // Do smart replacement for undefined URL params.
            // @TODO see into switching to regex replace for this.
            if (typeof params[key] === 'undefined') {
                tokens.push({
                    key: '/:' + key + '?',
                    value: ''
                });
                tokens.push({
                    key: ':' + key + '?',
                    value: ''
                });
                tokens.push({
                    key: ':' + key,
                    value: ''
                });
            }
            else {
                tokens.push({
                    key: ':' + key + '?',
                    value: params[key]
                });
                tokens.push({
                    key: ':' + key,
                    value: params[key]
                });
            }
        }
    }
    if (row && row.value) {
        var context = null;
        this.getTokens(context, row.value, tokens);
    }

    // Sort tokens from longest key to shortest. This ensures that a token like
    // :applePie beats :apple.
    tokens.sort(function(a, b) {
        return (b.key.length - a.key.length);
    })

    for (var i = 0, l = tokens.length; i < l; i++) {
        string = string.replace(tokens[i].key, tokens[i].value);
    }
    return string;
};

Handler.prototype.getTokens = function(context, pointer, tokens) {
    for (var key in pointer) {
        var childContext = context ? context + '.' + key : key;
        if (typeof pointer[key] === 'object') {
            this.getTokens(childContext, pointer[key], tokens);
        }
        else if (['string', 'number', 'boolean'].indexOf(typeof pointer[key]) !== -1) {
            tokens.push({
                key: '[' + childContext + ']',
                value: pointer[key]
            });
        }
    }
};

module.exports = Handler;

