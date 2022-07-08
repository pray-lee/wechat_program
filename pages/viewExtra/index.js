import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {formatNumber} from "../../util/getErrorMessage";

const app = getApp()
app.globalData.loadingCount = 0
Page({
    data: {
        isPhoneXSeries: false,
        baoxiaoDetail: null
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'extraObj',
            success: res => {
                let {subjectExtraConf, extraMessage, applicationAmount} = res.data
                subjectExtraConf = JSON.parse(subjectExtraConf)
                extraMessage = JSON.parse(extraMessage)
                let extraList = []
                const array = this.generateExtraList(subjectExtraConf)
                extraMessage.forEach(item => {
                    extraList.push({conf: array})
                })
                const tempData = {
                    extraList,
                    extraMessage,
                    applicationAmount: formatNumber(Number(applicationAmount).toFixed(2))
                }
                this.setData({
                    baoxiaoDetail: tempData,
                })
            },
        })
    },
    generateExtraList(conf) {
        var tempData = clone(conf)
        var array = []
        tempData.name.forEach((item, index) => {
            var obj = {}
            obj.field = item
            obj.type = tempData.type[index]
            obj.collectStatus = tempData.collectStatus[index] || '0'
            array.push(obj)
        })
        return array
    },
    addLoading() {
        if (app.globalData.loadingCount < 1) {
            wx.showLoading({
                title: '加载中...',
                mask: true
            })
        }
        app.globalData.loadingCount++
    },
    hideLoading() {
        app.globalData.loadingCount--
        if (app.globalData.loadingCount <= 0) {
            wx.hideLoading()
        }
    },
})
