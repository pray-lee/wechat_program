const app = getApp()
import {request} from '../../util/getErrorMessage'
Page({
    data: {
        expressInfo: {},
        type: 'add'
    },
    onLoad(query) {
        if(!!query.type && query.type === 'edit') {
            const expressInfo = wx.getStorageSync('expressInfo')
            console.log(expressInfo, '.....')
            this.setData({
                expressInfo,
                type: query.type
            })
        }
    },
    updateInfo() {
        console.log('修改客户信息')
    },
    bindKeyInput(e) {
        this.setData({
            expressInfo: {
                ...this.data.expressInfo,
                [e.currentTarget.dataset.type]: e.detail.value
            }
        })
        console.log(this.data.expressInfo)
    },
    addLoading() {
        if (app.globalData.loadingCount < 1) {
            wx.showLoading({
                content: '加载中...'
            })
        }
        app.globalData.loadingCount += 1
    },
    hideLoading() {
        if (app.globalData.loadingCount <= 1) {
            wx.hideLoading()
            app.globalData.loadingCount = 0
        } else {
            app.globalData.loadingCount -= 1
        }
    },
    save() {
        const customerDetailId = wx.getStorageSync('customerDetailId')
        this.setData({
            expressInfo: {
                ...this.data.expressInfo,
                customerDetailId
            }
        })
        this.addLoading()
        const url = app.globalData.url + (this.data.type === 'edit' ?
            'customerSpecialDeliveryController.do?doUpdate' :
            'customerSpecialDeliveryController.do?doAdd' )
        console.log(url, 'url')
        request({
            hideLoading: this.hideLoading,
            url: url,
            method: 'POST',
            data: this.data.expressInfo,
            success: res => {
                this.once()
            }
        })
    },
    once() {
        wx.setStorage({
            key: 'expressInfo',
            data: this.data.expressInfo,
            success: () => {
                wx.navigateBack({
                    delta: 2
                })
            }
        })
    },
})
