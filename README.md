Display 0.x for Express Lane
----------------------------
Display provides an API for displaying a view results in express. Each
display can be defined in a static settings object defining what fields to
display and how. The field system is pluggable allowing for additional field
handlers to be defined by other modules.

Assumptions
-----------
Display inherits some assumptions from its required environment expresslane.
In particular:

- View result sets are expected to be generated via CouchDB. The result set
  should be an array of objects where each object has a `value` key.  For
  example:

    array [
        value: {
            title: 'Foo',
            description: 'This is some foo',
        },
        value: {
            title: 'Bar',
            description: 'This is some bar',
        },
    ]

- The template engine used is [hbs](http://github.com/donpark/hbs) a light
  wrapper around [handlebars.js](http://github.com/wycats/handlebars.js).

Requirements
------------
- [node.js](http://github.com/ryah/node) 0.2.x
- [express](http://github.com/visionmedia/express) 1.x
- [expresslane](http://github.com/developmentseed/expresslane)
- [hbs](http://github.com/donpark/hbs)
- [cradle](http://github.com/cloudhead/cradle) for use with CouchDB.

Using display
-------------
Displays should be defined in `settings.js` or a sub module file required by
the main expresslane settings file like `settings.display.js`. Display expects
an object keyed by display name to be present at `require('settings').display`:

    module.exports = {
        display: {
            // Defines the `dataListing` display
            dataListing: {
                name: {
                    title: 'Name',
                    description: 'Lorem ipsum dolor sit amet',
                    type: 'value',
                    fields: [
                        { field: 'name' }
                    ]
                }
                // ... more fields
            }
            // ... more displays
        }
        // ... settings for other expresslane modules
    };

### Defining fields

Each display object contains a keyed list of field objects. Each field object
 can have the following fields:

- `title`: Optional. A title or label to display with this field.
- `description`: Optional. A short description to display with the field label.
- `help`: Optional. Help text or other notes.
- `type`: The field handler type to use for rendering. A list of available
  field handlers can be found below.
- `settings`: Optional. An object containing settings specific to each field
  handler type.
- `fields`: An array of one or more fields to be used for display. Each
  reference is an object with the following keys:
  - `field`: The document key where this field value can be found. For example,
    `name` will retrieve the value from `doc.value.name`. You may retrieve
    nested properties with a string like `phone.mobile`.
  - `title`: An optional label for this specific field value. Used by some
    field types like `graphCompare`.

Example:

    phone:  {
        title: 'Phone',
        description: 'The main contact number(s) of this individual',
        help: 'Reach this person by dialing one of the numbers.',
        type: 'value',
        fields: [
            { field: 'phone.home' },
            { field: 'phone.office' },
            { field: 'phone.mobile' }
        ]
    }

### Styles

Each display can be used in conjunction with a display style. The style
determines how to template the collection of fields defined in the display. The
styles currently available with display are:

- `table`: Displays each document as a row and each field as a cell in an HTML
  table. Field titles are displayed as table headers.
- `item`: Displays each document in a wrapping `div` and each field with a
  wrapping field div.

### Usage

The main function exposed by display is `style(req, style, name, rows)`:

- `req`: The request object for the current request.
- `style`: String name of the style to display, e.g. `table`.
- `name`: String name of the display configuration to use, e.g. `dataListing`.
- `rows`: An array of CouchDB rows returned by a query.

Returns an object that can be included in an express template's `locals` that
can be templated directly using the expresslane `template` helper function.

    // Show all user profiles at /profiles. Assume the loadAllProfiles router
    // middleware queries CouchDB for profile records and places them at
    // res.data.profiles.
    app.get('/profiles', loadAllProfiles, function(req, res, next) {
        var display = require('display');
        var profiles = res.data.profiles;
        var locals = {};
        locals.profiles = display.style(req, 'table', 'profiles', profiles);
        res.render('mypage', { locals: locals });
    });

In the `mypage.hbs` template:

    <div class='profiles'>
        {{#profiles}}{{{../template .}}}{{/profiles}}
    </div>

### Field handlers

The following field handlers are provided with display:

- `boolean`
- `value`
- `link`
- `percent`
- `image`
- `graphHistogram`
- `graphDivisible`
- `graphCompare`

@TODO descriptions, usable settings.
