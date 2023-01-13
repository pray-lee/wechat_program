import {formatNumber, request} from "../../../util/getErrorMessage";
import NP from "number-precision";
var app = getApp()
Page({
   data:{
      isPhoneXSeries: false,
      purchaseOrderList: [],
      searchResult: [],
      inputValue: ''
   },
   onLoad() {
      this.setData({
         isPhoneXSeries: app.globalData.isPhoneXSeries
      })
      wx.getStorage({
         key: 'importPurchaseOrderList',
         success: res => {
            const data = res.data.map(item => ({
               ...item,
               formatOriginAmount: formatNumber(Number(item.originAmount).toFixed(2)),
               formatBusinessDateTime: item.businessDateTime.split(' ')[0]
            }))
            this.setData({
               purchaseOrderList: data,
               searchResult: data
            })
         }
      })
   },
   hideLoading() {
      wx.hideLoading()
   },
   showLoading() {
      wx.showLoading({
         title: "数据加载中...",
         mask: true
      })
   },
   goBack(e) {
      // 未税金额=价税合计/(1+税率/100)
      const id = e.currentTarget.dataset.id
      this.showLoading()
      request({
         hideLoading: this.hideLoading(),
         url: `${app.globalData.url}purchaseOrderDetailController.do?listByOrderId&orderIds=${id}`,
         method: 'GET',
         success: res => {
            const rows = res.data.map(item => {
               const amount = NP.minus(NP.times(item.number, item.price), item.discountAmount || 0)
               const untaxedAmount = (item.taxRate ? NP.divide(NP.minus(NP.times(item.number, item.price), item.discountAmount || 0), NP.plus(1, NP.divide(item.taxRate, 100))) : NP.minus(NP.times(item.number, item.price), item.discountAmount || 0)).toFixed(2)
               const taxAmount = NP.minus(amount, untaxedAmount)
               return {
                  ...item,
                  goodsId: item.id || '',
                  unitId: item.goodsUnit || '',
                  amount,
                  originAmount: amount,
                  formatAmount: formatNumber(Number(amount).toFixed(2)),
                  formatOriginAmount: formatNumber(Number(amount).toFixed(2)),
                  untaxedAmount,
                  originUntaxedAmount: untaxedAmount,
                  formatUntaxedAmount: formatNumber(Number(untaxedAmount).toFixed(2)),
                  formatOriginUntaxedAmount: formatNumber(Number(untaxedAmount).toFixed(2)),
                  taxAmount,
                  formatTaxAmount: formatNumber(Number(taxAmount).toFixed(2))
               }
            })
            wx.setStorageSync('selectedPurchaseOrderDetailList', rows)
         },
         complete: () => {
            wx.navigateBack({
               delta: 1
            })
         }
      })
   },
   clearWord() {
      this.setData({
         inputValue: ''
      })
      this.searchFn('')
   },
   bindinput(e) {
      const value = e.detail.value
      if(!!app.globalData.timeOutInstance) {
         clearTimeout(app.globalData.timeOutInstance)
      }
      this.setData({
         inputValue: value
      })
      this.searchFn(value)
   },
   searchFn(value) {
      app.globalData.timeOutInstance = setTimeout(() => {
         var searchResult = this.data.purchaseOrderList.filter(item => (item.code + item['accountbookEntity.accountbookName'] + item['supplierDetailEntity.supplier.supplierName'] + item.originAmount).indexOf(value) !== -1)
         this.setData({
            searchResult: searchResult
         })
      }, 300)
   }
})
