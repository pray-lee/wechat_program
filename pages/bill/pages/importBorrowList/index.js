const app = getApp()
Page({
    data: {
        tempImportList: [],
        amountField: {
            unverifyAmount: 'unverifyAmount'
        }
    },
    onLoad() {
        const tempImportList = wx.getStorageSync('tempImportList')
        const multiCurrency = wx.getStorageSync('multiCurrency')
        if(multiCurrency) {
            this.setData({
                amountField: {
                    unverifyAmount: 'originUnverifyAmount'
                }
            })
        }else{
            this.setData({
                amountField: {
                    unverifyAmount: 'unverifyAmount'
                }
            })
        }
        tempImportList.forEach(item => {
            item.dataString = JSON.stringify(item)
        })
        this.setData({
            tempImportList
        })
        console.log(this.data.amountField, 'amountFied')
    },
    onCheckboxChange(e) {
        console.log(e)
    },
    onCheckboxSubmit(e) {
        var arr = e.detail.value.tempImportListValue
        arr = arr.map(item => {
            return JSON.parse(item)
        })
        console.log(arr, 'arr')
        var newArr = []
        for (let i = 0; i < arr.length; i++) {
            var temp = {
                ...arr[i],
                billDetailId: arr[i].id,
                applicationAmount: arr[i][this.data.amountField.unverifyAmount],
                remark: arr[i].remark
            }
            newArr.push(temp)
        }
        wx.setStorage({
            key: 'importList',
            data: newArr,
            success: res => {
                wx.removeStorage({
                    key: 'tempImportList',
                    success: res => {
                        console.log('清除tempImportList成功...')
                    }
                })
                wx.navigateBack({
                    delta: 1
                })
            }
        })
    },
})
