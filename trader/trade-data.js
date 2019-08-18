/**
 * Created by aweiu on 2017/6/7.
 */
const alias = {
  '库存数量': {
    names: ['证券数量', '参考持股', '当前拥股']
  },
  '成本价': {
    names: ['参考成本价']
  },
  '可卖数量': {
    names: ['可用股份']
  },
  '成交日期': {
    names: ['发生日期'],
    val: val => val.replace(/-/g, '')
  },
  '买卖标志': {
    names: ['买卖方向', '操作'],
    val: val => {
      if (val.indexOf('买入') !== -1) return '买入'
      else if (val.indexOf('卖出') !== -1) return '卖出'
    }
  },
  '状态说明': {
    names: ['委托状态', '撤单标志', '备注'],
    val: val => {
      if (['已报', '正常委托', '全部委托'].indexOf(val) !== -1) return '全部申报'
    }
  }
}
class TradeData {
  constructor (ret) {
    this.data = []
    if (!ret) ret = ''
    this.data = ret.split('\n').map(ret => ret.split('\t'))
    const names = this.data[0]
    for (let key in alias) {
      let i1 = names.indexOf(key)
      if (i1 === -1 && alias[key].names) {
        for (let name of alias[key].names) {
          i1 = names.indexOf(name)
          if (i1 !== -1) {
            names[i1] = key
            break
          }
        }
      }
      if (i1 !== -1 && alias[key].hasOwnProperty('val')) {
        for (let i2 = 1; i2 < this.data.length; i2++) {
          const val = alias[key].val(this.data[i2][i1])
          if (val !== undefined) this.data[i2][i1] = val
        }
      }
    }
  }

  toJSON (targetName) {
    const rs = {}
    if (targetName) {
      if (this.data.length > 1) {
        const names = this.data[0]
        const index = names.indexOf(targetName)
        for (let i1 = 1, l1 = this.data.length; i1 < l1; i1++) {
          let data = this.data[i1]
          let targetVal = data[index]
          rs[targetVal] = {}
          for (let i2 = 0; i2 < names.length; i2++) {
            if (i2 !== index) rs[targetVal][names[i2]] = data[i2]
          }
        }
      }
    } else {
      for (let i = 0; i < this.data[0].length; i++) rs[this.data[0][i]] = this._getJsonVal(i)
    }
    return rs
  }

  _getJsonVal (index) {
    const rs = []
    for (let i = 1, l = this.data.length; i < l; i++) rs.push(this.data[i][index])
    return rs
  }
}
module.exports = TradeData
