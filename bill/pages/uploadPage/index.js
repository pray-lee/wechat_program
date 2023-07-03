var app = getApp()
Page({
    data: {
        uploadSrc: ''
    },
    onLoad() {
        // web-view init
        this.webViewContext = wx.createWebViewContext('web-view-1')
        wx.httpRequest({
            url: app.globalData.url + 'aliyunController.do?getUUID',
            method: 'GET',
            dataType: 'json',
            success: res => {
                if(res.data.success && !!res.data.obj) {
                    var uuid = res.data.obj
                    this.setData({
                        uploadSrc: app.globalData.url + app.globalData.uploadUrl + uuid
                    })
                }
            },
            fail: res => {
                this.hideLoading()
            }

        })
    },
    uploadCallback(data) {
        if(!!data) {
            // 获取缓存数据
            wx.setStorage({
                key: 'fileList',
                data: data.detail,
                success: () => {
                    if(!!data.detail) {
                        wx.navigateBack({
                            delta: 1
                        })
                    }
                }
            })
        }
    },
})
