'use strict'

const wrap = require('co-wrap-all')
const BigNumber = require('bignumber.js')
const axios = require('axios')
const util = require('./util')
const config = require('../config')

const proto = Object.create(null)
module.exports = proto

/**
 * 发布合约
 * @param args
 * @returns {*}
 */
proto.release = function * (args) {
  try {
    if (!args) {
      throw new Error('args argument is required to contract.release')
    }

    if (!args.type) {
      throw new Error('args.type argument is required to contract.release')
    }

    if (!args.privateKey) {
      throw new Error('args.privateKey argument is required to contract.release')
    }

    if (!args.contractCode) {
      throw new Error('args.contractCode argument is required to contract.release')
    }

    const privateKey = args.privateKey
    const contractCode = args.contractCode

    const sdk = util.getSdkInstance(args.type)
    const sourceAddress = util.getAddressByPrivateKey(privateKey)

    let blobInfo = yield axios.post(`${config.host.protocol}${config.host.service}/contract/release`, {
      type: args.type,
      sourceAddress,
      contractCode,
      input: args.input || ''
    })

    blobInfo = blobInfo.data

    if (blobInfo.errorCode !== 0) {
      console.log('build blob error')
      return blobInfo
    }

    const blob = blobInfo.result.transactionBlob

    // 3. sign blob
    const signatureInfo = sdk.transaction.sign({
      privateKeys: [ privateKey ],
      blob
    })

    if (signatureInfo.errorCode !== 0) {
      console.log('signature error')
      return signatureInfo
    }

    const signature = signatureInfo.result.signatures
    // 4. submit transaction
    const transactionInfo = yield sdk.transaction.submit({
      blob,
      signature
    })

    if (transactionInfo.errorCode === 0) {
      // 合约hash
      const hash = transactionInfo.result.hash

      let info = {
        errorCode: 0,
        errorDesc: '',
        result:
        { contractAddressList: [],
          hash
        }
      }

      // 尝试查询的次数
      let retryCount = 10

      while (retryCount > 0) {
        yield this.sleep(3 * 1000)

        let addressInfo = yield this.getAddress(args.type, hash)

        if (addressInfo.result.contractAddressList.length === 0) {
          retryCount = retryCount - 1
        } else {
          retryCount = 0
          info = addressInfo
        }
      }

      return info
    }

    return transactionInfo
  } catch (err) {
    console.log(err)
  }
}

proto.debugForQuery = function * (args) {
  try {
    if (!args) {
      throw new Error('args argument is required to contract.debug')
    }

    if (!args.type) {
      throw new Error('args.type argument is required to contract.debug')
    }

    if (!args.contractAddress) {
      throw new Error('args.contractAddress argument is required to contract.debug')
    }

    const sdk = util.getSdkInstance(args.type)

    const opts = {
      // 2: 测试
      optType: 2,
      contractAddress: args.contractAddress
    }

    if (args.input) {
      opts.input = args.input
    }

    const info = yield sdk.contract.call(opts)
    return info
  } catch (err) {
    throw err
  }
}

proto.debugForMain = function * (args) {
  try {
    if (!args) {
      throw new Error('args argument is required to contract.debugForMain')
    }

    if (!args.type) {
      throw new Error('args.type argument is required to contract.debugForMain')
    }

    if (!args.privateKey) {
      throw new Error('args.privateKey argument is required to contract.debugForMain')
    }

    if (!args.contractAddress) {
      throw new Error('args.contractAddress argument is required to contract.debugForMain')
    }

    const privateKey = args.privateKey
    const contractAddress = args.contractAddress

    const sdk = util.getSdkInstance(args.type)
    const sourceAddress = util.getAddressByPrivateKey(privateKey)

    let blobInfo = yield axios.post(`${config.host.protocol}${config.host.service}/contract/invokeByBu`, {
      type: args.type,
      sourceAddress,
      contractAddress,
      buAmount: args.buAmount,
      input: args.input || ''
    })

    blobInfo = blobInfo.data

    if (blobInfo.errorCode !== 0) {
      console.log('build blob error')
      return blobInfo
    }

    const blob = blobInfo.result.transactionBlob

    // 3. sign blob
    const signatureInfo = sdk.transaction.sign({
      privateKeys: [ privateKey ],
      blob
    })

    if (signatureInfo.errorCode !== 0) {
      console.log('signature error')
      return signatureInfo
    }

    const signature = signatureInfo.result.signatures
    // 4. submit transaction
    let transactionInfo = yield sdk.transaction.submit({
      blob,
      signature
    })

    if (transactionInfo.errorCode === 0) {
      // 合约hash
      const hash = transactionInfo.result.hash
      // let info = {};
      // 尝试查询的次数
      let retryCount = 10

      while (retryCount > 0) {
        yield this.sleep(3 * 1000)
        // console.log(retryCount)
        let info = yield sdk.transaction.getInfo(hash)

        if (info.errorCode !== 0) {
          retryCount = retryCount - 1
        } else {
          retryCount = 0
        }
        transactionInfo = info
      }
    }

    return transactionInfo
  } catch (err) {
    console.log(err)
  }
}

proto.evaluateFee = function * (args) {
  try {
    if (!args) {
      throw new Error('args argument is required to contract.evaluateFee')
    }

    if (!args.type) {
      throw new Error('args.type argument is required to contract.evaluateFee')
    }

    if (!args.privateKey) {
      throw new Error('args.privateKey argument is required to contract.evaluateFee')
    }

    if (!args.contractCode) {
      throw new Error('args.contractCode argument is required to contract.evaluateFee')
    }

    const privateKey = args.privateKey
    const contractCode = args.contractCode

    const sdk = util.getSdkInstance(args.type)
    const sourceAddress = util.getAddressByPrivateKey(privateKey)
    const nonceInfo = yield sdk.account.getNonce(sourceAddress)

    if (nonceInfo.errorCode !== 0) {
      console.log('get nonce error')
      return nonceInfo
    }

    let nonce = nonceInfo.result.nonce
    nonce = new BigNumber(nonce).plus(1).toString(10)
    const contractCreateOperation = sdk.operation.contractCreateOperation({
      initBalance: '10000000',
      type: 0,
      payload: contractCode
    })

    if (contractCreateOperation.errorCode !== 0) {
      console.log('contract create operation')
      return contractCreateOperation
    }

    const operationItem = contractCreateOperation.result.operation
    const feeData = yield sdk.transaction.evaluateFee({
      sourceAddress,
      nonce,
      operations: [ operationItem ],
      signtureNumber: '1'
    })
    return feeData
  } catch (err) {
    throw err
  }
}

proto.getAddress = function * (type, hash) {
  if (typeof type === 'undefined') {
    throw new Error('type argument is required to contract.getAddress')
  }

  if (typeof hash === 'undefined') {
    throw new Error('hash argument is required to contract.getAddress')
  }

  const sdk = util.getSdkInstance(type)
  let contractAddressInfo = yield sdk.contract.getAddress(hash)
  contractAddressInfo.result.hash = hash
  return contractAddressInfo
}

proto.sleep = function (time = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

wrap(proto)
