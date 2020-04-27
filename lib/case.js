'use strict'

const wrap = require('co-wrap-all')
const axios = require('axios')
const config = require('../config')

const proto = Object.create(null)
module.exports = proto

proto.getList = function * () {
  try {
    const response = yield axios.get(`${config.host.protocol}${config.host.service}/case/list`)
    return response.data
  } catch (err) {
    throw err
  }
}

wrap(proto)
