import {formatNumber, request} from "../../../util/getErrorMessage";
import '../../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        warehouseAllocateOrderDetail: null,
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'warehouseAllocateOrderDetail',
            success: res => {
                const warehouseAllocateOrderDetail = clone(res.data)
                console.log(warehouseAllocateOrderDetail)
                this.setData({
                    warehouseAllocateOrderDetail: {
                        ...warehouseAllocateOrderDetail,
                        formatUnitAmount: formatNumber(Number(warehouseAllocateOrderDetail.unitAmount).toFixed(2))
                    }
                })
                wx.removeStorage({
                    key: 'warehouseAllocateOrderDetail',
                    success: res => {
                        console.log('删除查看采购订单详情成功....')
                    }
                })
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
        app.globalData.loadingCount++
    },
    hideLoading() {
        app.globalData.loadingCount--
        if (app.globalData.loadingCount <= 0) {
            wx.hideLoading()
        }
    },
})
