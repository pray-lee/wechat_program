import {formatNumber, request} from "../../util/getErrorMessage";
import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'

const app = getApp()
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
            key: 'baoxiaoDetail',
            success: res => {
                const baoxiaoDetail = clone(res.data)
                console.log(baoxiaoDetail, '..........')
                this.setData({
                    baoxiaoDetail
                })
                wx.removeStorage({
                    key: 'baoxiaoDetail',
                    success: res => {
                        console.log('删除查看报销详情成功....')
                    }
                })
            }
        })
    },
    openExtraInfo(e) {
        const extraMessage = this.data.baoxiaoDetail.extraMessage
        const subjectExtraConf =this.data.baoxiaoDetail.subjectExtraConf
        console.log(subjectExtraConf, 'subjectExtraConf')
        const applicationAmount = this.data.baoxiaoDetail.applicationAmount
        wx.setStorage({
            key: 'extraObj',
            data: {
                extraMessage,
                subjectExtraConf,
                applicationAmount
            },
            success: res => {
                wx.navigateTo({
                    url: '/pages/viewExtra/index'
                })
            }
        })
    }
})
