/* jshint browser: true */

var query = require('query')
var keyname = require('keyname')
var closest = require('closest')
var Classes = require('classes')
var debounce = require('debounce')
var next = require('next-sibling')
var prev = require('previous-sibling')

module.exports = Autocomplete

Autocomplete.prototype = Object.create(require('complement'))

function Autocomplete(el, menu) {
  if (!(this instanceof Autocomplete))
    return new Autocomplete(el, menu)

  this.el = el

  el.setAttribute('autocomplete', 'off')

  // you can set your own menu element
  if (!menu) {
    menu = document.createElement('div')
    el.parentNode.insertBefore(menu, el)
  }

  // hidden on initialization
  this.classes = Classes(this.menu = menu)
    .add('Autocomplete-menu')
    .add('Autocomplete-hidden')

  // current options
  this.options = []
  // currently highlighted option
  this.highlighted = null

  // setup stuff
  var self = this
  // search when the user changes the search text
  // debounced search
  var search = debounce(function () {
    self.query(el.value)
  }, 300)

  // setup complement methods
  this._onblur()
  this._setupoptions()

  // show the menu when the input is focused
  el.addEventListener('focus', function (e) {
    e.stopPropagation()
    self.show()
  }, false)

  el.addEventListener('keydown', function (e) {
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
        // select the current option
        self.select(self.highlighted)
        return
      case 'tab':
      case 'capslock':
      case 'right':
      case 'left':
      case 'meta':
      case 'shift':
      case 'ctrl':
      case 'alt':
      case 'meta':
      case 'pageup':
      case 'pagedown':
      case 'end':
      case 'home':
      case 'ins':
      case 'del':
        // ignore these keys from toggling anything
        return
    }

    search()
  })

  // manipulate the menu
  menu.addEventListener('keydown', function (e) {
    stop(e)

    switch (keyname(e.which)) {
      case 'down':
        self.show()
        self.next()
        self.highlighted.el.focus()
        return
      case 'up':
        if (self.get(0) === self.highlighted) return self.el.focus()
        self.show()
        self.previous()
        self.highlighted.el.focus()
        return
      case 'esc':
        self.hide()
        return
      case 'enter':
        self.select(self.find(e.target))
        return
    }
  })

  // highlight an option if the user somehow focuses on it
  menu.addEventListener('focus', function (e) {
    self.highlight(self.find(e.target))
  }, true)
}

/**
 * Only clears `.Autocomplete-option`s.
 */

Autocomplete.prototype.clear = function () {
  this.options = []
  this.selected = this.highlighted = null
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
  if (!this.classes.has('Autocomplete-hidden')) {
    this.classes.add('Autocomplete-hidden')
    this.highlighted = this.selected = null
    this.emit('hide')
    this.el.blur()
  }
  return this
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

Autocomplete.prototype.find = function (el) {
  return closest(el, '.Autocomplete-option', true)
}

function remove(el) {
  el.parentNode.removeChild(el)
}

function stop(e) {
  e.preventDefault()
  e.stopPropagation()
}
