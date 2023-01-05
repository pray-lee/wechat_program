import {cloneDeep as clone} from "lodash";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        kaipiaoDetail: null
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'kaipiaoDetail',
            success: (res) => {
                const kaipiaoDetail = clone(res.data)
                this.setData({
                    kaipiaoDetail
                })
                wx.removeStorage({
                    key: 'kaipiaoDetail',
                    success: res => {
                    }
                })
            }
        })
    },
})
