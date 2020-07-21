const app = getApp()
Page({
    data: {
        tempImportList: []
    },
    onLoad() {
        const tempImportList = wx.getStorageSync({
            key: 'tempImportList'
        })
        console.log(tempImportList)
        this.setData({
            tempImportList
        })
    },
    onCheckboxChange(e) {
        console.log(this.data.importList)
        console.log(e)
    },
    onCheckboxSubmit(e) {
        var arr = e.detail.value
        var newArr = []
        for (var i in arr) {
            if (arr[i].length) {
                var temp = {
                    ...arr[i][0],
                    billDetailId: arr[i][0].id,
                    applicationAmount: arr[i][0].unverifyAmount,
                    remark: arr[i][0].remark
                }
                newArr.push(temp)
            }
        }
        wx.setStorage({
            key: 'importList',
            data: newArr,
            success: res => {
                console.log('选择借款列表成功')
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
