function handler(req, identifier, config) {
    this.req = req;
    this.identifier = identifier;
    this.config = config;
    this.settings = config.settings || {};
}

handler.prototype.display = function() {
    var classes = [this.identifier, this.config.type];
    if (this.config.hidden) {
        classes.push('requires-full');
    }
    return {
        _template: __dirname + '/templates/' + this.config.type,
        class: classes.join(' '),
        label: this.config.title,
        values: []
    };
};

handler.prototype.displayEmpty = function() {
    var display = this.display();
    display._template = __dirname + '/templates/empty';
    display.class += ' empty';
    return display;
};

handler.prototype.build = function(row, rows) {
    if (this.isEmpty(row) || row.value._abstract) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row, false);
    for (var i = 0, l = fields.length; i < l; i++) {
        var field = fields[i];
        display.sort = display.sort || field.value;
        display.values.push(field.value);
    };
    return display;
};

handler.prototype.isEmpty = function(row) {
    return (this.getFields(row, false).length === 0);
};

handler.prototype.getFields = function(row, includeEmpty) {
    if (typeof includeEmpty === 'undefined') {
        includeEmpty = false;
    }
    // @TODO: reconsider this type filter.
    if (!this.config.entities || !row.value.type || this.config.entities.indexOf(row.value.type) !== -1) {
        var fields = [];
        for (var i = 0; i < this.config.fields.length; i++) {
            var copy = _.extend({}, this.config.fields[i]);
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

handler.prototype.getFieldValue = function(row, field) {
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

handler.prototype.label = function() {
    var classes = [this.identifier, this.config.type];
    if (this.config.hidden) {
        classes.push('requires-full');
    }
    return {
        _template: __dirname + '/templates/label',
        title: this.config.title,
        description: this.config.description || null,
        help: this.config.help || null,
        class: classes.join(' ')
    }    
};

handler.prototype.replaceTokens = function(string, row, params) {
    params = params || this.req.params;
    var tokens = {};
    if (params) {
        for (var key in params) {
            tokens[':' + key] = params[key];
        }
    }
    if (row && row.value) {
        var context = null;
        this.getTokens(context, row.value, tokens);
    }
    for (var key in tokens) {
        string = string.replace(key, tokens[key]);
    }
    return string;
};

handler.prototype.getTokens = function(context, pointer, tokens) {
    for (var key in pointer) {
        var childContext = context ? context + '.' + key : key;
        if (typeof pointer[key] === 'object') {
            this.getTokens(childContext, pointer[key], tokens);
        }
        else if (['string', 'number', 'boolean'].indexOf(typeof pointer[key]) !== -1) {
            tokens['[' + childContext + ']'] = pointer[key];
        }
    }
};

module.exports = handler;

