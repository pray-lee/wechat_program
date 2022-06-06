import moment from "moment";
import {cloneDeep as clone} from "lodash";
import {formatNumber, validFn} from "../../util/getErrorMessage";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        importList: [],
        remarks: [],
        saveFlag: false
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
    },
    bindObjPickerChange(e) {
        var id = e.currentTarget.dataset.id
        var value = e.detail.value
        // 设置当前框的值
        const importList = this.data.importList.map(item => {
            if(item.id === id) {
                item.remarkIndex = value
                item.remark = this.data.remarks[value].remark
            }
            return item
        })
        this.setData({
           importList
        })
    },
    showContent() {
        wx.showModal({
            content: '导入的单据此处不可编辑',
            confirmText: '好的',
            showCancel: false,
        })
    },
    getImportListFromStorage() {
        const importList = wx.getStorageSync('importList')
        const savedImportList = wx.getStorageSync('savedImportList') || []
        importList.forEach(item => item.applicationAmount = item.unverifyAmount)
        if(importList.length) {
            let oldList = savedImportList.concat()
            if(oldList.length) {
                for(let i = 0; i < importList.length; i++) {
                    if(oldList.every(item => item.id !== importList[i].id)) {
                        oldList.push(importList[i])
                    }else{
                        oldList = oldList.map(item => {
                            if(item.id === importList[i].id) {
                                return Object.assign({}, item, importList[i])
                            }else{
                                return item
                            }
                        })
                    }
                }
                // 数据组合
                this.setData({
                    importList: oldList
                })
            }else{
                this.setData({
                    importList: oldList.concat(importList)
                })
            }
        }else{
            this.setData({
                importList: savedImportList
            })
        }
        const tempData = this.data.importList
        for(let i = 0; i < tempData.length; i++) {
           for(let j = 0; j < this.data.remarks.length; j++) {
               if(this.data.remarks[j].remark === tempData[i].remark) {
                   tempData[i].remarkIndex = j
                   break
               }else{
                   tempData[i].remarkIndex = 0
               }
           }
        }
        this.setData({
            importList: tempData
        })
        wx.removeStorageSync(
            'savedImportList'
        )
        wx.removeStorageSync(
            'importList'
        )
    },
    // 获取开票内容
    getRemarksFromStorage(){
        const remarks = wx.getStorageSync('remarks')
        if(!!remarks && remarks.length) {
            this.setData({
                remarks,
            })
        }
    },
    onShow() {
        this.getRemarksFromStorage()
        this.getImportListFromStorage()
    },
    bindinput(e) {
        const value = e.detail.value
        const id = e.currentTarget.dataset.id
        const tempData = clone(this.data.importList)
        tempData.forEach(item => {
            if(item.id === id) {
                console.log(item)
                item.applicationAmount = value
                if(Number(value) > Number(item.unverifyAmount)) {
                    wx.showModal({
                        content: '开票金额不能大于可申请余额',
                        confirmText: '好的',
                        showCancel: false,
                    })
                    this.setData({
                        saveFlag: false
                    })
                }else{
                    this.setData({
                        saveFlag: true
                    })
                }
            }
        })
        this.setData({
            importList: tempData
        })
    },
    saveImportList() {
        console.log(this.data.importList)
        const saveFlag = this.data.importList.every(item => Number(item.applicationAmount) <= Number(item.unverifyAmount))
        if(!saveFlag) {
            wx.showModal({
                content: '开票金额不能大于可申请余额',
                confirmText: '好的',
                showCancel: false,
            })
            return
        }
        wx.removeStorageSync(
            'tempImportList'
        )
        this.data.importList.forEach(item => {
            item.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2))
            item.billId = item.id
            item.subjectName = item['subjectEntity.fullSubjectName']
        })
        wx.setStorage({
            key: 'importCommonList',
            data: this.data.importList,
            success: () => {
                wx.navigateBack({
                    delta: 2
                })
            }
        })
    },
    suppleImportList() {
        wx.setStorage({
            key: 'savedImportList',
            data: this.data.importList,
            success: () => {
                wx.navigateBack({
                    delta: 1
                })
            }
        })
    },
    deleteImportInputList(e) {
        const id = e.currentTarget.dataset.id
        const importList = this.data.importList.filter(item => item.id !== id)
        this.setData({
            importList
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
        if (app.globalData.loadingCount <= 0) {
            wx.hideLoading()
        }
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
