var app = getApp()
import { request } from "../../../util/getErrorMessage"
Page({
   data: {
      page: 1,
      isPhoneXSeries: false,
      goodsList: [],
      inputValue: ''
   },
   async initGoodsList() {
      const data = await this.getGoodsList(this.data.page)
      this.setData({
         goodsList: data
      })
   },
   onLoad() {
      this.setData({
         isPhoneXSeries: app.globalData.isPhoneXSeries
      })
      this.initGoodsList()
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
   async loadMoreData() {
      wx.showLoading({
         title: '加载中...',
         mask: true
      })
      this.setData({
         page: this.data.page + 1
      })
      const data = await this.getGoodsList(this.data.page)
      this.setData({
         goodsList: this.data.goodsList.concat(data)
      })
   },
   async getGoodsList(page) {
      this.showLoading()
      return new Promise((resolve, reject) => {
         request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}goodsController.do?getGoodsListForSelect&field=id,goodsCode,goodsName,goodsTypeId,goodsTypeName,goodsBrand,goodsSpecs,goodsUnit,goodsUnitName,multiUnit,isBom,typeName,attributeDetailName,auxiliaryAttribute,auxiliaryAttributeName,goodsPrivateEntity&accountbookId=&keyword=${this.data.inputValue}&rows=30&page=${page}`,
            method: 'GET',
            success: res => {
               if (res.statusCode == 200) {
                  resolve(res.data.rows)
               } else {
                  resolve(false)
               }
            },
         })
      })
   },
   goBack(e) {
      const id = e.currentTarget.dataset.id
      const goodsInfo = this.data.goodsList.filter(item => item.id === id)[0]
      // 补一下goodsId
      goodsInfo.goodsId = goodsInfo.id
      wx.setStorage({
         key: 'goodsInfo',
         data: goodsInfo,
         success: res => {
            wx.navigateBack({
               delta: 1
            })
         }
      })
   },
   bindinput(e) {
      const value = e.detail.value
      if (!!app.globalData.timeOutInstance) {
         clearTimeout(app.globalData.timeOutInstance)
      }
      this.setData({
         inputValue: value
      })
      this.searchFn(value)
   },
   clearWord() {
      this.setData({
         inputValue: ''
      })
      this.searchFn('')
   },
   clearGoodsList() {
      this.setData({
         page: 0,
         goodsList: []
      })
   },
   searchFn(value) {
      this.clearGoodsList()
      app.globalData.timeOutInstance = setTimeout(() => {
         this.loadMoreData(value) 
      }, 300)
   },
})
