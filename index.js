'use strict';

const fs = require('fs')
const assert = require('assert')
const Redis = require('ioredis')
const CronJob = require('cron').CronJob
const Promise = require('bluebird')

const getJob = fs.readFileSync('./lua/getJob.lua', 'utf-8')

const DEFAULT_OPTION = {
  prefix: 'curator',
  retry: 5,
  retryInterval: 60 * 1000
}

class Curator {
  constructor(options = DEFAULT_OPTION) {
    assert(typeof options.prefix === 'string', 'opations.prefix should be a string')
    assert(typeof options.retry === 'number', 'opations.retry should be a number')
    assert(typeof options.retryInterval === 'number', 'opations.retryInterval should be a number')

    this.prefix = options.prefix
    this.retry = options.retry
    this.retryInterval = options.retryInterval
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

    if (this.jobs[name]) {
      this.jobs[name].stop()
      delete this.jobs[name]
    }

    this.redis.sadd({
      name: 0
    })
    .then(() => {
      this.job[name] = new CronJob(timming, () => {
        this.redis.getJob(name)
          .then(job())
      })
    })
  }
}
