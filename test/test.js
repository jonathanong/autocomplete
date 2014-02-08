var query = require('query')
var assert = require('assert')
var classes = require('classes')
var trigger = require('trigger-event')
var Autocomplete = require('autocomplete')

var input = document.createElement('input')
document.body.appendChild(input)
var search = Autocomplete(input)
search.query = function (text) {
  if (!text) return
  search.clear()
  for (var i = 0; i < text.length; i++) {
    search.push(text.slice(0, i + 1))
  }
  search.highlight(0)
}

describe('Autocomplete', function () {
  describe('should hide when', function () {
    it('clicking outside', function () {
      var el = document.createElement('div')
      document.body.appendChild(el)
      search.show()
      trigger(el, 'click')
      assert(search.classes.has('Autocomplete-hidden'))
    })

    it('focusing outside', function () {
      var el = document.createElement('input')
      document.body.appendChild(el)
      search.show()
      el.focus()
      assert(search.classes.has('Autocomplete-hidden'))
    })
  })

  describe('on keydown', function () {
    it('should highlight the first option', function (done) {
      input.value = 'asdf'
      trigger(input, 'keydown')

      setTimeout(function () {
        assert(search.highlighted.id === 'a')
        done()
      }, 301)
    })
  })

  describe('.highlight()', function () {
    it('should emit a `highlight` event', function (done) {
      search.once('highlight', function (option) {
        assert(option.id === 'asdf')
        done()
      })

      search.highlight('asdf')
    })
  })

  describe('when focusing an option', function () {
    it('should highlight that option', function () {
      search.highlight('a').el.focus()
      assert(classes(search.get('a').el).has('Autocomplete-highlighted'))
    })
  })

  describe('.select()', function () {
    it('should emit a `change` event', function (done) {
      search.once('change', function (option) {
        assert(option.id === 'asd')
        done()
      })

      search.select('asd')
    })

    it('should select .highlighted', function () {
      search.select('asdf')
      assert(search.highlighted === search.get('asdf'))
    })
  })

  describe('when clicking an option', function () {
    it('should select that option', function () {
      trigger(search.get('a').el, 'click')
      assert(search.selected.id === 'a')
    })
  })

  describe('.next()', function () {
    it('should highlight the next option', function () {
      search.next()
      assert(search.highlighted.id === 'as')
    })
  })

  describe('.previous()', function () {
    it('should highlight the previous option', function () {
      search.previous()
      assert(search.highlighted.id === 'a')
    })
  })

  describe('.hide()', function () {
    it('should dehighlight all elements', function () {
      search.hide()

      assert(!query('Autocomplete-highlighted'))
      assert(!search.highlighted)
    })
  })

  describe('.clear()', function () {
    it('should remove all options', function () {
      search.clear()

      assert(!query('Autocomplete-option'))
      assert(!search.options.length)
      assert(!search.highlighted)
    })
  })
})