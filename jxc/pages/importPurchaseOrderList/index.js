import {formatNumber, request} from "../../../util/getErrorMessage";

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
      const id = e.currentTarget.dataset.id
      this.showLoading()
      request({
         hideLoading: this.hideLoading(),
         url: `${app.globalData.url}purchaseOrderDetailController.do?listByOrderId&orderIds=${id}`,
         method: 'GET',
         success: res => {
            wx.setStorageSync('selectedPurchaseOrderDetailList', res.data)
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
