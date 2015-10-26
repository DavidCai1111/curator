'use strict';
const should = require('should')
const Curator = require('../index')
const sinon = require('sinon')

describe('curator test', () => {

  it('basic functionality', function (done) {
    this.timeout(1000 * 10)
    let clock = sinon.useFakeTimers()
    let called = 0
    let curator = new Curator()
    curator.connect({host: '127.0.0.1', port: 6379})
    function job() {
      called++
    }
    curator.add('basic-functionality-test', '00 00 06 * * *', job)

    clock.tick(1000 * 60 * 60 * 22)
    called.should.eql(1)
    clock.restore()
    done()
  })
});
