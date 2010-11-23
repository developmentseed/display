function handler (req, identifier, config) {
    require('./base').call(this, req, identifier, config);
    this.settings.domain = this.settings.domain || 0;
    this.settings.simplify = this.settings.simplify || 1;
    this.settings.highlight = this.settings.highlight || false;
}

require('sys').inherits(handler, require('./base'));

handler.prototype.label = function() {
    var label = require('./base').prototype.label.call(this);
    if (this.settings.highlight) {
        label.class += ' graphHistogramHighlight';
        label.title = "<div class='range'></div>" + label.title;
    }
    return label;
};

handler.prototype.build = function (row, rows) {
    if (this.isEmpty(row)) { return this.displayEmpty(); }

    var display = this.display();
    var fields = this.getFields(row);

    var series = this.series(fields[0].value, this.settings);
    display.histogram = this.flot(this.simplify(series, this.settings), this.settings);
    display.histogram_raw = JSON.stringify(series);
    if (this.settings.highlight) {
        display.class += ' graphHistogramHighlight';
        display.values = this.highlighted(series, this.settings);
        display.sort = display.values.percent;
    }
    return display;
};

/**
 * Flot graph from histogram.
 */
handler.prototype.flot = function (histogram, settings) {
    var series = [];
    if (settings.highlight) {
        series.push({ 'data': histogram.slice(0, (settings.highlight[0] / settings.simplify)), 'shadowSize': 0 });
        series.push({ 'data': histogram.slice((settings.highlight[0] / settings.simplify)), 'shadowSize': 0 });
        series.push({ 'data': [], 'shadowSize': 0 });
    }
    else {
        series.push({ 'data': histogram, 'shadowSize': 0 });
    }
    return JSON.stringify([
        series,
        {
            'colors': ['#ccc', '#d44', '#ccc'],
            'grid': {
                'labelMargin': 0,
                'tickColor': '#eee',
                'backgroundColor': '#fff',
                'borderWidth': 0,
                'hoverable': false,
                'clickable': false,
                'autoHighlight': false
            },
            'lines' : {
                'show': true,
                'lineWidth': 0,
                'fill': 1.00,
                'steps': true
            },
            'points': {
                'radius': 0,
                'lineWidth': 0
            },
            'shadowSize': 0,
            'xaxis': { 'ticks': [] },
            'yaxis': { 'ticks': [] }
        }
   ]);
}

/**
 * Given an associative histogram object {0: 50, 10: 19, ... } generate a
 * flot-friendly series array with interpolated 0 values.
 *
 * @param Object totals
 *   Histogram object where key, value corresponds to histogram x, y.
 * @param Number domain
 *   Domain size for the resulting histogram series. Defaults to 600.
 * @return Array
 *   Histogram series.
 */
handler.prototype.series = function (totals, settings) {
    var series = [];
    var domain = settings.domain || 0;
    if (domain === 0) {
        var x = 0;
        for (var i in totals) {
            series.push([x, totals[i]]);
            x++;
        }
    }
    else {
        for (var x = 0; x < domain; x++) {
            if (totals[x]) {
                series[x] = [x, totals[x]];
            }
            else {
                series[x] = [x, 0];
            }
        }
    }
    // Enforce min & max domains
    if (settings.domain_min && series.length < settings.domain_min) {
        for (var i = series.length; i < settings.domain_min; i++) {
            series.push([i, 0]);
        }
    }
    else if (settings.domain_max && series.length > settings.domain_max) {
        series = series.slice(0, settings.domain_max);
    }
    return series;
}

/**
 * Equivalent to series() but generates a simplified histogram with
 * values grouped into chunks represented by the divisor param.
 *
 * @param Object totals
 *   Histogram object where key, value corresponds to histogram x, y.
 * @param Number domain
 *   Domain size for the "original" histogram series. Defaults to 600.
 * @param Number divisor
 *   Divisor by which to reduce the domain size. Must divide the domain evenly.
 *   Defaults to 10.
 * @return Array
 *   Simplified histogram series.
 */
handler.prototype.simplify = function (totals, settings) {
    var domain = settings.domain || totals.length;
    var divisor = settings.simplify || 1;
    var series = [];
    for (var x = 0; x < domain; x++) {
        if (!series[Math.floor(x / divisor)]) {
            series[Math.floor(x / divisor)] = [Math.floor(x / divisor), 0];
        }
        if (totals[x] && totals[x][1]) {
            var dividend = x === 0 ? 1 : (((x % divisor) + x) / (x));
            series[Math.floor(x / divisor)][1] += (dividend * totals[x][1]);
        }
    }
    return series;
}

/**
 * Generated default highlighted values.
 */
handler.prototype.highlighted = function(totals, settings) {
    var domain = settings.domain || totals.length;
    var highlight = settings.highlight;
    var sum = 0;
    var highlighted = 0;
    for (var x = 0; x < domain; x++) {
        if (totals[x] && totals[x][1]) {
            if (x >= highlight[0] && x <= highlight[1]) {
                highlighted += totals[x][1] * x;
            }
            sum += totals[x][1] * x;
        }
    }
    return {
        percent: sum > 0 ? Math.floor((highlighted / sum) * 100) : 0,
        votes: require('./util').ac(highlighted)
    };
}

module.exports = handler;
