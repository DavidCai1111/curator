'use strict';

const fs = require('fs')
const assert = require('assert')
const Redis = require('ioredis')
const CronJob = require('cron').CronJob
const Promise = require('bluebird')
const debug = require('debug')('curator')

const getJob = fs.readFileSync('./lua/getJob.lua', 'utf-8')

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

    this.redis.hset(['curator:jobs', name, 0])
    .then((result) => {
      debug(`add success: ${result}`)
      ctx.jobs[name] = new CronJob(timming, () => {
        ctx.redis.getJob(name)
          .then((result) => {
            job()
          })
      }).start()
    })
  }
}

module.exports = Curator
