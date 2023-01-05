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
            this.setData({
                expressInfo,
                type: query.type
            })
        }
    },
    updateInfo() {
    },
    bindKeyInput(e) {
        this.setData({
            expressInfo: {
                ...this.data.expressInfo,
                [e.currentTarget.dataset.type]: e.detail.value
            }
        })
    },
    addLoading() {
        if (app.globalData.loadingCount < 1) {
            wx.showLoading({
                title: '加载中...',
                mask: true
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
