import {cloneDeep as clone} from "lodash";
import {formatNumber, validFn, request} from "../../util/getErrorMessage";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        fukuanDetail: {},
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
    },
    onShow() {
        let fukuanDetail = wx.getStorageSync('fukuanDetail')
        fukuanDetail.formatUnverifyAmount = formatNumber(Number(fukuanDetail.unverifyAmount).toFixed(2))
        if(!!fukuanDetail) {
            this.setData({
                fukuanDetail
            })
            wx.removeStorage({
                key: 'fukuanDetail'
            })
        }
    },
    onKaipiaoBlur(e) {
        var tempData = clone(this.data.fukuanDetail)
        tempData.applicationAmount = e.detail.value
        tempData['formatApplicationAmount'] = formatNumber(Number(e.detail.value).toFixed(2))
        this.setData({
            fukuanDetail: tempData,
        })
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
    submitFukuanDetail() {
        if(Number(this.data.fukuanDetail.applicationAmount) > Number(this.data.fukuanDetail.unverifyAmount)) {
            wx.showModal({
                content: '开票金额不能大于可申请余额',
                confirmText: '好的',
                showCancel: false,
            })
            return
        }
        wx.setStorage({
            key: 'fukuanDetail',
            data: this.data.fukuanDetail,
            success() {
                wx.navigateBack({
                    delta: 1
                })
            }
        })
    },
    disabled(e) {
        wx.showModal({
            content: '导入的单据此处不可编辑',
            confirmText: '好的',
            showCancel: false,
        })
    },
    onKeyboardShow() {
        this.setData({
            btnHidden: true
        })
    },
    onKeyboardHide() {
        this.setData({
            btnHidden: false
        })
    }
})
