'use strict'

const wrap = require('co-wrap-all')
const axios = require('axios')
const encryption = require('hpchain-encryption')
const KeyPair = encryption.keypair
const config = require('../config')
const util = require('./util')

const proto = Object.create(null)

module.exports = proto
/**
 * 通过账户私钥获取账户地址
 *
 * @param {string} privateKey - 账户私钥
 * @return {Object}
 */
proto.getAddressByPrivateKey = function (privateKey) {
  try {
    if (privateKey === undefined) {
      throw new Error('privateKey argument is required to getAddressByPrivateKey()')
    }

    if (!util.isPrivateKey(privateKey)) {
      return util.responseError(1, 'private key is invalid')
    }

    const address = util.getAddressByPrivateKey(privateKey)
    return util.responseData({
      address
    })
  } catch (err) {
    throw err
  }
}

/**
 * 创建新账户
 *
 * @return {Object} - (包含 privateKey, publicKey, address)
 */
proto.create = function () {
  try {
    const keypair = KeyPair.getKeyPair()
    const data = {
      privateKey: keypair.encPrivateKey,
      publicKey: keypair.encPublicKey,
      address: keypair.address
    }
    return util.responseData(data)
  } catch (err) {
    throw err
  }
}

/**
 * 获取账户余额
 *
 * @param {Object} args - 参数对象
 * @param  {string} args.type - 环境类型[production, development, sandbox]
 * @param  {string} args.address - 账户地址
 * @return {Object} - 包含账户地址的对象
 */
proto.getBalance = function * (args) {
  try {
    if (!args) {
      throw new Error('args argument is required to getBalance')
    }

    if (!args.type) {
      throw new Error('args.type argument is required to getBalance')
    }

    if (!args.address) {
      throw new Error('args.address argument is required to getBalance')
    }

    const sdk = util.getSdkInstance(args.type)
    return yield sdk.account.getBalance(args.address)

    // const host = `http://${config.host.service}/account/getBalance`;
    // const response = yield axios.get(host, {
    //   params: {
    //     type: args.type,
    //     address: args.address,
    //   },
    // });
    // return response.data;
  } catch (err) {
    throw err
  }
}

/**
 * 给账户充值（转移BU）
 *
 * @param {Object} args - 参数对象
 * @param  {String} args.type - 环境类型[production, development, sandbox]
 * @param  {String} args.address - 账户地址
 * @return {Object}
 */
proto.recharge = function * (args) {
  try {
    if (!args) {
      throw new Error('args argument is required to recharge')
    }

    if (!args.type) {
      throw new Error('args.type argument is required to recharge')
    }

    if (!args.address) {
      throw new Error('args.address argument is required to recharge')
    }

    const host = `${config.host.protocol}${config.host.service}/account/recharge`
    const response = yield axios.post(host, {
      type: args.type,
      address: args.address
    })
    return response.data
  } catch (err) {
    throw err
  }
}

wrap(proto)
