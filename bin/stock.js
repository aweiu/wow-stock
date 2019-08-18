#!/usr/bin/env node
const program = require('commander')
const package = require('../package')
const utils = require('../utils')
const stock = require('../stock')
// const fecha = require('fecha') 目前 trade.dll 已无法使用
// const Trader = require('../trader') 目前 trade.dll 已无法使用
// const config = require('../config') 目前 trade.dll 已无法使用

let holdingNumber
let todayTraded
let isAction = false
// const trader = new Trader(config) 目前 trade.dll 已无法使用

async function getTodayTraded (quotes) {
  let sold = 0
  let bought = []
  const date = fecha.format(new Date(), 'YYYYMMDD')
  const tradeData = await trader.queryHistoryData(1, date)
  const history = tradeData.toJSON()
  const types = history['买卖标志']
  const numbers = history['成交数量'].map(num => Number(num))
  for (let i = 0; i < types.length; i++) {
    const num = numbers[i]
    const code = history['证券代码'][i]
    const quote = quotes[code]
    const cost = history['成交价格'][i]
    if (num > 0) {
      if (types[i] === '卖出') sold += (cost - quote.close) * num
      else if (types[i] === '买入') bought.push({ code, cost, num })
    }
  }
  return { sold, bought }
}

function getIncomeTodayTraded (quotes) {
  if (!todayTraded) return 0
  let income = todayTraded.sold
  for (let bought of todayTraded.bought) {
    income += (quotes[bought.code].now - bought.cost) * bought.num
  }
  return income
}

async function logPosition (log) {
  let incomeToday = 0
  let _holdingNumber = 0
  const position = await trader.queryData(1)
  const tradeData = position.toJSON('证券代码')
  const codes = Object.keys(tradeData)
  if (codes.length === 0) {
    return log('暂无持仓数据')
  }
  const quotes = await stock.getQuotes(codes)
  for (let code of codes) {
    const data = tradeData[code]
    const quote = quotes[code]
    _holdingNumber += Number(data['股份余额'])
    incomeToday += (data['当前价'] - quote.close) * data['可卖数量']
    log(data['证券名称'][0], data['当前价'], utils.getRate((data['当前价'] - quote.close) / quote.close), data['浮动盈亏'], (data['盈亏比例(%)'] + '%').replace(/%\1+/g, '%'))
  }
  if (holdingNumber !== _holdingNumber) {
    todayTraded = await getTodayTraded(quotes)
    holdingNumber = _holdingNumber
  }
  incomeToday += getIncomeTodayTraded(quotes)
  log(incomeToday.toFixed(2))
}

async function logQuotes (codes, log) {
  const quotes = await stock.getQuotes(codes.split(','))
  for (let code in quotes) {
    const quote = quotes[code]
    log(code, quote.now, quote.rate)
  }
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function watch (fun, interval) {
  while (true) {
    await fun()
    await delay(interval)
  }
}

function doLog (...works) {
  const fun = async () => {
    // 同时执行多个异步任务并保证 log 顺序
    let allLogs = works.map(() => [])
    await Promise.all(
      works.map(
        (work, index) => work((...args) => allLogs[index].push(args))
      )
    )
    utils.clearLog()
    for (let logs of allLogs) {
      for (let args of logs) {
        utils.log.apply(utils, args)
      }
    }
  }
  if (program.watch) {
    void watch(fun, 1500)
  } else {
    void fun()
  }
}

program
  .version(package.version, '-v, --version')
  .usage('[options] <codes ...>')
  .option('-w --watch', 'watch stocks in real time')
  .action(codes => {
    if (typeof codes === 'string') {
      isAction = true
      doLog((log) => logQuotes(codes, log))
    }
  })
program.parse(process.argv)

if (!isAction) {
  // doLog(log => logQuotes('sh,sz', log), logPosition) 目前 trade.dll 已无法使用
  doLog(log => {
    log('由于 trade.dll 已无法使用，已关闭查看持仓功能，当前仅支持查看股票行情')
    log('如果你确定自己有办法，请自行编辑源码测试...')
  })
}
