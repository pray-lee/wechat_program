var app = getApp()
Page({
    data:{
        isPhoneXSeries: false,
        capitalList: [],
        searchResult: [],
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'capitalList',
            success: res => {
                this.setData({
                    capitalList: res.data,
                    searchResult: res.data
                })
            }
        })
    },
    goBack(e) {
        const id = e.currentTarget.dataset.id
        const name = e.currentTarget.dataset.name
        const obj = {id, name}
        wx.setStorageSync({
            key: 'capital',
            data: obj,
        })
        console.log('设置资金计划成功...')
        wx.navigateBack({
            delta: 1
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
            var searchResult = this.data.capitalList.filter(item => item.name.indexOf(value) !== -1)
            this.setData({
                searchResult: searchResult
            })
        }, 300)
    }
})
