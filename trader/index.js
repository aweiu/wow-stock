const path = require('path')
const ffi = require('ffi')
const utils = require('./utils')
const methods = require('./methods')
const TradeData = require('./trade-data')

const dir = path.join(__dirname, 'dlls')
ffi.Library("kernel32", {'SetDllDirectoryA': ["bool", ["string"]]}).SetDllDirectoryA(dir)
const lib = ffi.Library('trade', methods)
let libInit = false

module.exports = class Trader {
  constructor (options) {
    this._options = options
  }

  async _callLib (api, ...args) {
    // open lib
    if (!libInit) {
      libInit = true
      lib.OpenTdx()
      process.on('exit', () => lib.CloseTdx())
    }

    // 操作依赖
    if (utils.needLogin(api)) {
      if (this.id === undefined) this.id = await this._login()
      args.unshift(this.id)
    }

    const method = methods[api]
    let tradeResult, tradeError
    if (method[1][method[1].length - 2] === 'char *') args.push(tradeResult = Buffer.alloc(40960))
    if (method[1][method[1].length - 1] === 'char *') args.push(tradeError = Buffer.alloc(256))
    return new Promise((resolve, reject) => {
      args.push((e, rs) => {
        if (e) return reject(e)
        if (tradeError) {
          const errInfo = utils.toGBK(tradeError)
          if (errInfo.length > 0) return reject(Error(`${api} > ${errInfo}`))
        }
        if (tradeResult) tradeResult = utils.toGBK(tradeResult)
        resolve({
          code: rs,
          data: tradeResult
        })
      })
      lib[api].async.apply(null, args)
    })
  }

  async _login () {
    if (!this.__login) {
      const { ip, port, salesDepartmentCode, accountId, accountPassword, tradeId, tradePassword } = this._options
      this.__login = this._callLib('Logon', ip, port, 'V7.45', salesDepartmentCode, accountId, tradeId, accountPassword, tradePassword)
    }
    const { code } = await this.__login
    return code
  }

  async queryData (category) {
    const { data } = await this._callLib('QueryData', category)
    return new TradeData(data)
  }

  async queryHistoryData (category, startDate, endDate) {
    const { data } = await this._callLib('QueryHistoryData', category, startDate, endDate || startDate)
    return new TradeData(data)
  }
}
