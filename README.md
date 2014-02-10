# Autocomplete

An autocomplete component. Couldn't get others to work how I want it to, so I made my own.

Prior art:

- [yields/select](http://github.com/yields/select)
- [matthewmueller/autocomplete](https://github.com/matthewmueller/autocomplete)

Some philosophicaly differences:

- Mobile first - so touching outside the menu/input closes the menu. Tap support!
- No blur events - alt-tabbing or clicking outside the viewport won't close the menu
- The menu doesn't close when selected - you have to do it yourself
- Queryless - includes no query structure. You must implement querying yourself!
- Progressive enhancement - doesn't create the `<input>` element dynamically

## Demo

```bash
make
open test/index.html
```

You can also run the tests by:

```bash
npm i -g component-test
make test
```

## API

```jade
.container
  .Autocomplete-menu
  input
```

Note that `.Autocomplete-menu` has `position: absolute;` by default, so you should have a non-statically positioned parent somewhere.

### var search = autocomplete(element, [menu])

`element` is the `<input>` element to enhance. `menu` is an optional menu element to use - by default it creates its own and appends it before the input.

### search.query=

You need to set your own query function. Your query function should look something like this:

```js
search.query = function (text) {
  // remove all the options
  search.clear()

  ajax(function (err, options) {
    // do your own error handling
    if (err) return console.error(err.stack);

    // push all the options to the menu
    search.push(options)

    // highlight the first option
    search.highlight(0)
  })
}
```

Each `option` should be an `{}` with an `.id` as well as either a `.title` or a `.name`. Each `option` could also be a string, which will automatically be converted to an object.

### search.format=

Customize the formatting of every option. By default, it is:

```js
search.format = function (option) {
  return '<div>' + (option.name || option.title) + '</div>'
}
```

You may return either an HTML string or a DOM element.

### search.push(options...)

Push options to the menu.

### search.clear()

Remove all the options from the menu.

### search.selected

Selection option, if any.

### Event: change

When an option is selected

### search.highlighted

Currently highlighted option.

### search.hide()

Hide the menu.

### Event: hide

When the menu is hidden

### search.show()

Show the menu.

### Event: show

When the menu is shown

### Event: highlight

When an option is highlighted

## Browser Compatibility

IE9+ - PRs for IE8 welcomed.

## License

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.