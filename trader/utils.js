const iconv = require('iconv-lite')
module.exports = {
  toGBK (buffer) {
    return iconv.decode(buffer, 'gbk').replace(/\0/g, '')
  },
  needLogin (api) {
    return ['QueryData', 'QueryHistoryData', 'SendOrder'].includes(api)
  }
}