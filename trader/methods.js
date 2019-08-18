module.exports = {
  OpenTdx: ['void', []],
  Logon: ['int', ['string', 'int', 'string', 'int', 'string', 'string', 'string', 'string', 'char *']],
  Logoff: ['void', ['int']],
  CloseTdx: ['void', []],
  QueryData: ['void', ['int', 'int', 'char *', 'char *']],
  QueryHistoryData: ['void', ['int', 'int', 'string', 'string', 'char *', 'char *']],
  SendOrder: ['void', ['int', 'int', 'int', 'string', 'string', 'float', 'int', 'char *', 'char *']]
}
