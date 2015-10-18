'use strict';

const fs = require('fs')
const assert = require('assert')
const Redis = require('ioredis')
const CronJob = require('cron').CronJob
const co = require('co')
const debug = require('debug')('curator')

const getJob = fs.readFileSync('./lua/getJob.lua', 'utf-8')
const addJob = fs.readFileSync('./lua/addJob.lua', 'utf-8')

const DEFAULT_OPTION = {
  prefix: 'curator',
  retry: 5,
  retryInterval: 60 * 1000
}

class Curator {
  constructor(options) {
    options = options || {}
    this.prefix = options.prefix || DEFAULT_OPTION.prefix
    this.retry = options.retry || DEFAULT_OPTION.retry
    this.retryInterval = options.retryInterval || DEFAULT_OPTION.retryInterval
    this.jobs = {}
    this.redis = null

    return this
  }

  connect(config) {
    if (Array.isArray(config)) {
      this.redis = new Redis.Cluster(config)
    } else {
      this.redis = new Redis(config)
    }

    this.redis.defineCommand('getJob', {
      numberOfKeys: 1,
      lua: getJob
    })

    this.redis.defineCommand('addJob', {
      numberOfKeys: 1,
      lua: addJob
    })

    return this
  }

  add(name, timming, job) {
    assert(typeof name === 'string', 'name should be a string')
    assert(typeof timming === 'string', 'timming should be a string')
    assert(typeof job === 'function', 'job should be a function')
    name = `${this.prefix}:${name}`
    let ctx = this
    if (this.jobs[name]) {
      this.jobs[name].stop()
      delete this.jobs[name]
    }

    co(function* () {
      let nAdd = yield ctx.redis.addJob(name)

      ctx.jobs[name] = new CronJob(timming, () => {
        co(function* () {
          let result = yield ctx.redis.getJob(name)
          job()
        }).catch(onerror)
      }).start()
    }).catch(onerror)
  }
}

const onerror = function (err) {
  debug(err)
}

module.exports = Curator
