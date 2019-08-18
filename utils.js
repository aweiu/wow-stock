let logLines = 0
module.exports = {
  getRate (num) {
    return (num * 100).toFixed(2) + '%'
  },
  log (...args) {
    process.stdout.write(args.join(' ') + '\n')
    logLines++
  },
  clearLog () {
    if (logLines === 0) return
    process.stdout.moveCursor(0, -logLines)
    process.stdout.clearLine()
    logLines = 0
  }
}
