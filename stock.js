const axios = require('axios')
const iconv = require('iconv-lite')
const utils = require('./utils')

function SinaQuotesToJson (SinaQuotes) {
  const markets = {}
  for (let market of SinaQuotes.split('\n')) {
    if (!market) break
    const [leftStr, rightStr] = market.split('=')
    const data = rightStr.split(',')
    const code = leftStr.substr(13)
    markets[code] = code.length === 6 ? {
      name: data[0].substr(1),
      now: Number(data[3]),
      open: Number(data[1]),
      close: Number(data[2]),
      rate: utils.getRate((data[3] - data[2]) / data[2]),
      buy: [Number(data[11]), Number(data[13]), Number(data[15]), Number(data[17]), Number(data[19])],
      sell: [Number(data[21]), Number(data[23]), Number(data[25]), Number(data[27]), Number(data[29])]
    } : {
      name: data[0].substr(1),
      now: Number(data[1]),
      rate: data[3] + '%'
    }
  }
  return markets
}

function getFullStockCode (code) {
  const index = {
    sz: 's_sz399001',
    sh: 's_sh000001'
  }
  const firstWord = code[0]
  if (['0', '1', '2', '3'].includes(firstWord)) return 'sz' + code
  if (['5', '6', '9'].includes(firstWord)) return 'sh' + code
  return index[code] || code
}

module.exports = {
  getQuotes (codes) {
    return axios.get(
      'http://hq.sinajs.cn/list=' + codes.map(code => getFullStockCode(code)),
      { responseType: 'arraybuffer' }
    )
      .then(rs => SinaQuotesToJson(iconv.decode(rs.data, 'gbk')))
  }
}
