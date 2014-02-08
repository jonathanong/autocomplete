/* jshint browser: true */

var query = require('query')
var domify = require('domify')
var tap = require('tap-event')
var keyname = require('keyname')
var closest = require('closest')
var Emitter = require('emitter')
var Classes = require('classes')
var debounce = require('debounce')
var clickable = require('clickable')
var next = require('next-sibling')
var prev = require('previous-sibling')

Emitter(Autocomplete.prototype)

module.exports = Autocomplete

function Autocomplete(el, menu) {
  if (!(this instanceof Autocomplete))
    return new Autocomplete(el, menu)

  this.el = el

  // you can set your own menu element
  if (!menu) {
    menu = document.createElement('div')
    el.parentNode.insertBefore(menu, el)
  }

  // hidden on initialization
  this.classes = Classes(this.menu = menu)
    .add('Autocomplete-menu')
    .add('Autocomplete-hidden')

  // give it a tabindex of keydown events
  // menu.setAttribute('tabindex', 1)

  // current options
  this.options = []
  // currently highlighted option
  this.highlighted = null

  // setup stuff
  this._oninputfocus()
  this._onblur()
  this._oninputkeydown()
  this._onmenukeydown()
  this._onoptionclick()
  this._onoptionfocus()
  this._onmousemove()
}

// show the menu when the input is focused
Autocomplete.prototype._oninputfocus = function () {
  this.el.addEventListener('focus', this.show.bind(this), false)
}

// hide the menu when losing focus,
// specifically outside the input and the menu
// note: we don't actually listen to the blur event
Autocomplete.prototype._onblur = function () {
  var self = this
  var el = this.el
  var menu = this.menu

  document.addEventListener('click', hide, false)
  document.addEventListener('touchstart', hide, false)
  document.addEventListener('focus', hide, true)

  function hide(e) {
    if (!clickable(e)) return
    // autocleanup if the element is removed from the document
    // apparently IE11 doesn't like `document.contains()`
    if (!document.body.contains(el)) {
      document.removeEventListener('click', hide, false)
      document.removeEventListener('touchstart', hide, false)
      document.removeEventListener('focus', hide, true)
      return
    }

    // hide if focusing outside this element and menu
    var target = e.target
    if (target === el
      || target === menu
      || menu.contains(target)) return

    self.hide()
  }
}

// search when the user changes the search text
Autocomplete.prototype._oninputkeydown = function () {
  var self = this
  var el = this.el

  // debounced search
  var search = debounce(function () {
    self.query(el.value)
  }, 300)

  el.addEventListener('keydown', function (e) {
    if (!pressable(e)) return

    switch (keyname(e.which)) {
      case 'down':
        stop(e)
        self.show()
        self.next()
        return
      case 'up':
        stop(e)
        self.show()
        self.previous()
        return
      case 'esc':
        stop(e)
        self.hide()
        return
      case 'enter':
        // highlight the current option or the first one
        if (self.highlighted) self.select(self.highlighted)
        return
      case 'tab':
      case 'capslock':
      case 'right':
      case 'left':
      case 'meta':
        // ignore these keys
        return
    }

    search()
  })
}

Autocomplete.prototype._onmenukeydown = function () {
  var self = this

  this.menu.addEventListener('keydown', function (e) {
    if (!pressable(e)) return

    switch (keyname(e.which)) {
      case 'down':
        stop(e)
        self.show()
        self.next()
        self.highlighted.el.focus()
        return
      case 'up':
        stop(e)
        if (self.get(0) === self.highlighted) return self.el.focus()
        self.show()
        self.previous()
        self.highlighted.el.focus()
        return
      case 'esc':
        console.log('menu escape')
        stop(e)
        self.hide()
        return
      case 'enter':
        self.select(find(e.target))
        return
    }
  })
}

// set an option when the user clicks it or taps it
Autocomplete.prototype._onoptionclick = function () {
  var self = this
  var menu = this.menu

  menu.addEventListener('touchstart', tap(click), false)
  menu.addEventListener('click', click, false)

  function click(e) {
    if (!clickable(e)) return
    self.select(find(e.target))
  }
}

// highlight an option if the user somehow focuses on it
Autocomplete.prototype._onoptionfocus = function () {
  var self = this
  var menu = this.menu

  menu.addEventListener('focus', function (e) {
    self.highlight(find(e.target))
  }, true)
}

// highlight the currently hovered option
Autocomplete.prototype._onmousemove = function () {
  var self = this
  var menu = this.menu

  menu.addEventListener('mousemove', function (e) {
    self.highlight(find(e.target))
  })
}

/**
 * You MUST implement this yourself.
 *
 * autocomplete.query = function (text) {
 *   this.push({
 *     id: '',
 *     title: '',
 *   })
 * }
 *
 * If you don't use `this.push()`, then you should add
 * the options to the menu yourself.
 */

Autocomplete.prototype.query = function () {
  throw new Error('not implemented!')
}

/**
 * Only clears `.Autocomplete-option`s.
 */

Autocomplete.prototype.clear = function () {
  this.options = []
  this.selected = null
  this.highlighted = null
  var options = query.all('.Autocomplete-option', this.menu)
  for (var i = 0; i < options.length; i++) remove(options[i])
  return this
}

Autocomplete.prototype.show = function () {
  var classes = this.classes
  if (classes.has('Autocomplete-hidden')) {
    if (!this.selected) this.highlight(0)
    classes.remove('Autocomplete-hidden')
    this.emit('show')
  }
  return this
}

Autocomplete.prototype.hide = function () {
  if (!this.selected) this.el.value = ''

  if (!this.classes.has('Autocomplete-hidden')) {
    this.classes.add('Autocomplete-hidden')

    this.highlighted = null
    this.options.forEach(function (option) {
      Classes(option.el).remove('Autocomplete-highlighted')
    })

    this.emit('hide')
  }
  return this
}

/**
 * Push a bunch of options.
 */

Autocomplete.prototype.push = function (option) {
  this.show()

  // multiple arguments support
  if (arguments.length > 1) {
    for (var i = 0; i < arguments.length; i++) this.push(arguments[i])
    return
  } else if (Array.isArray(option)) {
    option.forEach(this.push, this)
    return
  }

  // convert strings to valid options
  if (typeof option === 'string') {
    option = {
      id: option,
      title: option
    }
  }

  if (!option.id || !(option.title || option.name))
    throw new Error('each option needs a .id and .title/.name')

  var el = this.format(option)
  if (typeof el === 'string') el = domify(el)
  this.formatOption(option, el)
  el.setAttribute('tabindex', this.options.push(option))
  this.menu.appendChild(el)
  return option
}

/**
 * Format an option either to a DOM element
 * or to an HTML string.
 *
 * You should overwrite this yourself.
 */

Autocomplete.prototype.format = function (option) {
  return '<div>'
    + (option.title || option.name || option.id)
    + '</div>'
}

/**
 * Format the element of an option.
 * If you want to manipulate items yourself,
 * Use this method.
 */

Autocomplete.prototype.formatOption = function (option, el) {
  Classes(option.el = el).add('Autocomplete-option')
  el.setAttribute('data-Autocomplete-id', option.id)
  return option
}

/**
 * Get an option based on an id, element, option object, or index.
 */

Autocomplete.prototype.get = function (x) {
  if (x == null) return
  var options = this.options
  var option
  for (var i = 0; i < options.length; i++) {
    option = options[i]
    if (option === x
      || option.id === x
      || option.el === x
      || i === x)
      return option
  }
}

/**
 * When an option is set, i.e. actually emit a `change` event.
 */

Autocomplete.prototype.select = function (option) {
  if (!(option = this.highlight(option))) return
  this.selected = option
  this.el.value = option.name || option.title
  this.emit('change', option)
  return option
}

/**
 * Select an option.
 */

Autocomplete.prototype.highlight = function (option) {
  if (!(option = this.get(option))) return
  this.emit('highlight', this.highlighted = option)
  var options = this.options
  var o
  var el = option.el
  for (var i = 0; i < options.length; i++)
    Classes(o = options[i].el)
      .toggle('Autocomplete-highlighted', o === el)
  return option
}

// highlight the next element
Autocomplete.prototype.next = function () {
  var highlighted = this.highlighted
  if (!highlighted) return
  return this.highlight(next(highlighted.el, '.Autocomplete-option'))
}

// highlight the previous element
Autocomplete.prototype.previous = function () {
  var highlighted = this.highlighted
  if (!highlighted) return
  return this.highlight(prev(highlighted.el, '.Autocomplete-option'))
}

function find(el) {
  return closest(el, '.Autocomplete-option', true)
}

function remove(el) {
  el.parentNode.removeChild(el)
}

function stop(e) {
  e.preventDefault()
  e.stopPropagation()
}

function pressable(e) {
  return !(e.ctrlKey
    || e.altKey
    || e.shiftKey
    || e.metaKey)
}