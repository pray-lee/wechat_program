import {formatNumber, request} from "../../../util/getErrorMessage";
import '../../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        purchaseOrderDetail: null,
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'purchaseOrderDetail',
            success: res => {
                const purchaseOrderDetail = clone(res.data)
                this.setData({
                    purchaseOrderDetail: {
                        ...purchaseOrderDetail,
                        formatNumber: formatNumber(Number(purchaseOrderDetail.number).toFixed(2)),
                        formatPrice: formatNumber(Number(purchaseOrderDetail.price).toFixed(2)),
                        formatDiscountAmount: formatNumber(Number(purchaseOrderDetail.discountAmount).toFixed(2)),
                        formatOriginAmount: formatNumber(Number(purchaseOrderDetail.originAmount).toFixed(2)),
                        formatTaxAmount: formatNumber(Number(purchaseOrderDetail.taxAmount).toFixed(2)),
                        formatUntaxedAmount: formatNumber(Number(purchaseOrderDetail.untaxedAmount).toFixed(2)),
                    }
                })
                wx.removeStorage({
                    key: 'purchaseOrderDetail',
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
