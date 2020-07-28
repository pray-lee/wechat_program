import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {formatNumber, request} from "../../util/getErrorMessage";

var app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        result: null,
        process: null,
    },
    addLoading() {
        if (app.globalData.loadingCount < 1) {
            wx.showLoading({
                title: '加载中...',
                mask: true
            })
        }
        app.globalData.loadingCount += 1
    },
    hideLoading() {
        if (app.globalData.loadingCount <= 1) {
            wx.hideLoading()
            app.globalData.loadingCount = 0
        } else {
            app.globalData.loadingCount -= 1
        }
    },
    previewFile(e) {
        var url = e.currentTarget.dataset.url
        wx.previewImage({
            urls: [url],
        })
    },
    onLoad(query) {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'borrowBillController.do?getDetail&id=' + query.id,
            method: 'GET',
            success: res => {
                const result = clone(res.data.obj)
                result.amount = formatNumber(Number(result.amount).toFixed(2))
                result.billDetailList.forEach(item => {
                    item.borrowAmount = formatNumber(Number(item.borrowAmount).toFixed(2))
                })
                if(res.data.success) {
                    this.setData({
                        result
                    })
                }else{
                    wx.showModal({
                        content:'数据请求失败',
                        confirmText: '好的',
                        showCancel: false,
                    })
                }
                this.getProcessInstance(result.id, result.accountbookId)
            },
            fail: res => {
                wx.showModal({
                    content:'数据请求失败',
                    confirmText: '好的',
                    showCancel: false,
                })
            },
        })
    },
    getProcessInstance(billId, accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'dingtalkController.do?getProcessinstanceJson&billType=4&billId=' + billId + '&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                if(res.data && res.data.length) {
                    const { title, operationRecords, tasks, ccUserids } = res.data[0]
                    const taskArr = tasks.filter(item => {
                        if(item.taskStatus === 'RUNNING') {
                            if(item.userid.split(',')[2]){
                                item.userName = item.userid.split(',')[2]
                                item.realName = item.userid.split(',')[0].length > 1 ? item.userid.split(',')[0].slice(-2) : item.userid.split(',')[0]
                            }else{
                                item.userName = item.userid.split(',')[0].length > 1 ? item.userid.split(',')[0].slice(-2) : item.userid.split(',')[0]
                                item.realName = item.userid.split(',')[0].length > 1 ? item.userid.split(',')[0].slice(-2) : item.userid.split(',')[0]
                            }
                            item.avatar = item.userid.split(',')[1]
                            console.log(item.avatar)
                            item.resultName = '（审批中）'
                            item.operationName = '审批人'
                            return item
                        }
                    })

                    // 抄送人
                    let cc = []
                    if(ccUserids && ccUserids.length) {
                        cc = ccUserids.map(item => {
                            return {
                                userName: item.split(',')[0],
                                realName: item.split(',')[0].length > 1 ? item.split(',')[0].slice(-2) : item.split(',')[0],
                                avatar: item.split(',')[1]
                            }
                        })
                    }

                    const operationArr = operationRecords.filter(item => {
                        if(item.userid.split(',')[2]){
                            item.userName = item.userid.split(',')[2]
                            item.realName = item.userid.split(',')[0].length > 1 ? item.userid.split(',')[0].slice(-2) : item.userid.split(',')[0]
                        }else{
                            item.userName = item.userid.split(',')[0].length > 1 ? item.userid.split(',')[0].slice(-2) : item.userid.split(',')[0]
                            item.realName = item.userid.split(',')[0].length > 1 ? item.userid.split(',')[0].slice(-2) : item.userid.split(',')[0]
                        }
                        item.avatar = item.userid.split(',')[1]
                        if(item.operationType === 'START_PROCESS_INSTANCE') {
                            item.operationName = '发起审批'
                        } else if(item.operationType !== 'NONE') {
                            item.operationName = '审批人'
                        }
                        if(item.operationResult === 'AGREE') {
                            item.resultName = '（已同意）'
                        }else if(item.operationResult === 'REFUSE') {
                            item.resultName = '（已拒绝）'
                        }else{
                            item.resultName = ''
                        }
                        if(item.operationType !== 'NONE') {
                            return item
                        }
                    })
                    this.setData({
                        process: {
                            title,
                            operationRecords: operationArr,
                            tasks: taskArr,
                            cc
                        }
                    })
                }
            },
        })
    },
})
