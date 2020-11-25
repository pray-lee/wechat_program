import {cloneDeep as clone} from "lodash";
import {formatNumber, request} from "../../util/getErrorMessage";

var app = getApp()
app.globalData.loadingCount = 0
Page({
    data: {
        result: null,
        isPhoneXSeries: false,
    },
    addLoading() {
        if (app.globalData.loadingCount < 1) {
            wx.showLoading({
                content: '加载中...'
            })
        }
        app.globalData.loadingCount++
    },
    hideLoading() {
        app.globalData.loadingCount--
        if (app.globalData.loadingCount === 0) {
            wx.hideLoading()
        }
    },
    previewFile(e) {
        var url = e.currentTarget.dataset.url
        wx.previewImage({
            urls: [url],
        })
    },
    onLoad(query) {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        this.addLoading()
        const id = query.id
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoicebillController.do?getDetail&id=' + id,
            method: 'GET',
            success: res => {
                if (res.data.obj) {
                    console.log(res.data.obj, 'obj')
                    const result = clone(res.data.obj)
                    result.billDetailList.forEach(item => {
                        item.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2))
                    })
                    this.setData({
                        result
                    })
                }
            }
        })
    },
    showKaipiaoDetail(e) {
        const index = e.currentTarget.dataset.index
        const tempData = clone(this.data.result.billDetailList[index])
        console.log(tempData, 'viewKaipiao')
        wx.setStorage({
            key: 'kaipiaoDetail',
            data: tempData,
            success: res => {
                wx.navigateTo({
                    url: '/pages/viewKaipiaoDetail/index'
                })
            }
        })
    },
    rollBack() {
        this.addLoading()
        request({
            hideLoading: this.hideLoading(),
            url: app.globalData.url + 'invoicebillController.do?doBatchTemporaryStorage&ids=' + this.data.result.id,
            method: 'GET',
            success: res => {
                if(res.data.success) {
                    wx.redirectTo({
                        url: `/pages/addKaipiao/index?type=edit&id=${this.data.result.id}`
                    })
                }else{
                    wx.showModal({
                        content: '撤回失败',
                        confirmText: '好的',
                        showCancel: false,
                    })
                }
            }
        })
    }
})