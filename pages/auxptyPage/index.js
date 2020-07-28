var app = getApp()
Page({
    data:{
        isPhoneXSeries: false,
        auxptyList: [],
        searchResult: [],
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'auxptyList',
            success: res => {
                console.log(res, '获取辅助核算')
                this.setData({
                    auxptyList: res.data,
                    searchResult: res.data
                })
            }
        })
    },
    goBack(e) {
        console.log(e)
        const id = e.currentTarget.dataset.id
        const name = e.currentTarget.dataset.name
        const auxptyId = e.currentTarget.dataset.auxptyid
        const obj = {
            id,
            name,
            auxptyId
        }
        wx.setStorage({
            key: 'auxpty',
            data: obj,
            success: res => {
                console.log('设置辅助核算成功...')
                console.log(obj)
                wx.navigateBack({
                    delta: 1
                })
            }
        })
    },
    bindinput(e) {
        const value = e.detail.value
        if(!!app.globalData.timeOutInstance) {
            clearTimeout(app.globalData.timeOutInstance)
        }
        this.searchFn(value)
    },
    searchFn(value) {
        app.globalData.timeOutInstance = setTimeout(() => {
            var searchResult = this.data.auxptyList.filter(item => item.name.indexOf(value) !== -1)
            this.setData({
                searchResult: searchResult
            })
        }, 300)
    }
})
