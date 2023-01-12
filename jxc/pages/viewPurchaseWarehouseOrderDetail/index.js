import {formatNumber, request} from "../../../util/getErrorMessage";
import '../../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        purchaseWarehouseOrderDetail: null,
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'purchaseWarehouseOrderDetail',
            success: res => {
                const purchaseWarehouseOrderDetail = clone(res.data)
                this.setData({
                    purchaseWarehouseOrderDetail: {
                        ...purchaseWarehouseOrderDetail,
                        formatNumber: formatNumber(Number(purchaseWarehouseOrderDetail.number).toFixed(2)),
                        formatPrice: formatNumber(Number(purchaseWarehouseOrderDetail.price).toFixed(2)),
                        discountRate: purchaseWarehouseOrderDetail.discountRate ? purchaseWarehouseOrderDetail.discountRate : '',
                        formatDiscountAmount: purchaseWarehouseOrderDetail.discountAmount ? formatNumber(Number(purchaseWarehouseOrderDetail.discountAmount).toFixed(2)) : '',
                        formatOriginAmount: formatNumber(Number(purchaseWarehouseOrderDetail.originAmount).toFixed(2)),
                        formatTaxAmount: formatNumber(Number(purchaseWarehouseOrderDetail.taxAmount).toFixed(2)),
                        formatUntaxedAmount: formatNumber(Number(purchaseWarehouseOrderDetail.untaxedAmount).toFixed(2)),
                    }
                })
                wx.removeStorage({
                    key: 'purchaseWarehouseOrderDetail',
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
