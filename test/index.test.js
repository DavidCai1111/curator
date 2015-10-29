'use strict'
/* global describe, it */
require('should')
const Curator = require('../index')
const sinon = require('sinon')

describe('curator test', () => {
  it('basic functionality', function (done) {
    this.timeout(1000 * 10)
    let clock = sinon.useFakeTimers()
    let called = false
    let curator = new Curator()
    curator.connect({host: '127.0.0.1', port: 6379})
    function job (done) {
      called = true
      done()
    }
    curator.add('basic', '00 00 06 * * *', job)
    clock.tick(1000 * 60 * 60 * 22)
    called.should.be.true()
    clock.restore()
    done()
  })
})
