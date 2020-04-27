'use strict'

module.exports = {
  host: {
    production: process.env.BASE_API + '/production',
    development: process.env.BASE_API + '/development',
    sandbox: process.env.BASE_API + '/sandbox',
    service: process.env.BASE_API + '/service',
    protocol: process.env.PROTOCOL
  }
}
