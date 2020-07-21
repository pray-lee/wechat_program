var app = getApp()
Page({
    data:{
        isPhoneXSeries: false,
        subjectList: [],
        searchResult: [],
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'subjectList',
            success: res => {
                this.setData({
                    subjectList: res.data,
                    searchResult: res.data
                })
            }
        })
    },
    goBack(e) {
        const id = e.currentTarget.dataset.id
        const name = e.currentTarget.dataset.name
        const subjectExtraId = e.currentTarget.dataset.extraId
        const obj = {id, name, subjectExtraId}
        console.log(obj, 'goBack')
        wx.setStorageSync({
            key: 'subject',
            data: obj,
        })
        console.log('设置科目id成功')
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
            var searchResult = this.data.subjectList.filter(item => item.name.indexOf(value) !== -1)
            this.setData({
                searchResult: searchResult
            })
        }, 300)
    }
})
