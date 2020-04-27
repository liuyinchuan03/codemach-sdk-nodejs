'use strict'

const BigNumber = require('bignumber.js')
const long = require('long')
const encryption = require('hpchain-encryption')
const keypair = encryption.keypair
const BumoSDK = require('bumo-sdk')
const config = require('../config')

const proto = Object.create(null)
module.exports = proto

/**
 * 是否为合法私钥
 *
 * @param {string} privateKey - 用户私钥
 * @return {Boolean} - 是否为合法私钥
 */
proto.isPrivateKey = function (privateKey) {
  return keypair.checkEncPrivateKey(privateKey)
}

/**
 * 通过账户私钥获取账户地址
 *
 * @param {string} privateKey - 账户私钥
 * @return {*} - 账户地址| false(当privateKey不是私钥时)
 */
proto.getAddressByPrivateKey = function (privateKey) {
  if (!this.isPrivateKey(privateKey)) return false
  const publicKey = keypair.getEncPublicKey(privateKey)
  return keypair.getAddress(publicKey)
}

/**
 * 输出数据信息
 *
 * @param {*} data - 待输出的数据
 * @return {Object} - 包含数据的对象
 */
proto.responseData = function (data) {
  return {
    errorCode: 0,
    errorDesc: '',
    result: data || ''
  }
}

/**
 * 输出错误信息
 *
 * @param {number} errorCode - 错误码
 * @param {string} errorDesc - 错误描述信息
 * @return {Object} - 包含错误信息的对象
 */
proto.responseError = function (errorCode, errorDesc) {
  return {
    errorCode: errorCode,
    errorDesc: errorDesc
  }
}

proto.getSdkInstance = function (type) {
  if (!type) {
    throw new Error('type argument is required to uti.getSdkInstance')
  }

  let host = ''

  switch (type) {
    case 'production':
      host = config.host.production
      break
    case 'development':
      host = config.host.development
      break
    default:
      host = config.host.sandbox
  }

  return new BumoSDK({
    host,
    // secure: process.env.PROTOCOL === 'https://' ? true : false,
    secure: (process.env.PROTOCOL === 'https://')
  })
}

proto.isFloat = function (str) {
  const reg = /^\d+(\.\d+)?$/
  return (
    typeof str === 'string' &&
    reg.test(str) &&
    long.fromValue(str).greaterThanOrEqual(0) &&
    long.fromValue(str).lessThanOrEqual(long.MAX_VALUE)
  )
}

proto.isInt = function (str) {
  const reg = /^\d+?$/
  return (
    typeof str === 'string' &&
    reg.test(str) &&
    long.fromValue(str).greaterThanOrEqual(0) &&
    long.fromValue(str).lessThanOrEqual(long.MAX_VALUE)
  )
}

proto.buToMo = function (bu) {
  if (!this.isFloat(bu)) {
    throw new Error('bu is invalid to util.buToMo')
  }

  const oneBu = Math.pow(10, 8)
  const mo = new BigNumber(bu).times(oneBu)
  return mo.toString()
}

proto.moToBu = function (mo) {
  if (!this.isInt(mo)) {
    throw new Error('mo is invalid to util.buToMo')
  }

  const oneBu = Math.pow(10, 8)
  const bu = new BigNumber(mo).dividedBy(oneBu)
  return bu.toString()
}
