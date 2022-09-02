import {loginFiled, formatNumber, request} from "../../util/getErrorMessage";
import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'

var app = getApp()
app.globalData.loadingCount = 0
Page({
    data: {
        // 增加申请人
        realName: '',
        // =============外币相关============
        multiCurrency: false,
        baseCurrencyName: '',
        currencyTypeName: '',
        baseCurrency: '',
        exchangeRate: '',
        // ==============外币相关=============
        isPhoneXSeries: false,
        result: null,
        process: null,
        caikaProcess: null,
        statusObj: {
            1: '审批中',
            2: '已同意',
            0: '',
            '-1': '已撤回',
            '-2': '已驳回'
        },
        // oa===============================
        query: {},
        historyOaList: [],
        judgeShowOperate: false,
        dialogHidden: true,
        maskHidden: true,
        animationInfo: {},
        approvalType: '',
        submitOaData: {
            id: '',
            processInstanceId: '',
            comment: '',
            approveResult: null
        },
        submitOaType: {
            approval: 1,
            reject: 0
        }
        // oa===============================
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
    previewFile(e) {
        var url = e.currentTarget.dataset.url
        wx.previewImage({
            urls: [url],
        })
    },
    getDetail(query) {
        if(app.globalData.isWxWork) {
            const sessionId = wx.getStorageSync('sessionId')
            if(!sessionId) {
                this.addLoading()
                wx.qy.login({
                    success: res => {
                        this.hideLoading()
                        this.addLoading()
                        request({
                            hideLoading: this.hideLoading,
                            url: app.globalData.url + "loginController.do?loginWeiXin&tenantCode=" + app.globalData.tenantCode + "&code=" + res.code + '&corpId=' + app.globalData.corpId,
                            method: 'GET',
                            success: res => {
                                if (res.data.success) {
                                    if(res.data.obj) {
                                        wx.setStorageSync('sessionId', res.header['Set-Cookie'])
                                        wx.setStorageSync('realName', res.data.obj.realName)
                                        wx.setStorageSync('applicantId', res.data.obj.id)
                                        app.globalData.realName = res.data.obj.realName
                                        this.getDetailById(query)
                                    }else{
                                        loginFiled(res.data.msg)
                                    }
                                } else {
                                    loginFiled(res.data.msg)
                                }
                            },
                            fail: res => {
                            }
                        })
                    },
                    fail: res => {
                        this.hideLoading()
                        wx.showModal({
                            content: '当前组织没有该小程序',
                            confirmText: '好的',
                            showCancel: false,
                            success: res => {
                                wx.reLaunch({
                                    url: '/pages/error/index'
                                })
                            }
                        })
                    }
                })
            }else{
                this.getDetailById(query)
            }
        }
    },
    onLoad(query) {
        // 增加申请人
        this.setData({
            realName: app.globalData.realName
        })
        this.setData({
            query: {...query}
        })
        this.getDetail(query)
    },
    getDetailById(query) {
        // oa===============================
        if(query.processInstanceId) {
            this.setOaQuery(query)
        }
        this.getHistoryOaList(query)
        // oa===============================
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        this.addLoading()
        const id = query.id
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'reimbursementBillController.do?getDetail&id=' + id,
            method: 'GET',
            success: res => {
                if (res.data.obj) {
                    const result = clone(res.data.obj)
                    // 报销类型
                    this.getReimbursementName(result.reimbursementType)
                    // ============外币=============
                    this.getCurrencyTagByAccountbookId(result)
                    // 获取钉钉审批流
                    this.getProcessInstance(result.id, result.accountbookId)
                }
            }
        })
        // 获取审批信息
        this.getCaikaProcessInstance(query)
    },
    getHistoryOaList(query) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'oaController.do?lastActivityNodeList&billId=' + query.id,
            method: 'GET',
            success: res => {
                if(res.statusCode === 200) {
                    const historyOaList = this.handleData(res.data)
                    this.setData({
                        historyOaList: historyOaList.map(item => ({...item, showUserList: false, assigneeNameSlice: item.assigneeName.slice(-2)}))
                    })
                }
            }
        })
    },
    toggleUserList(e) {
        const index = e.currentTarget.dataset.index
        this.data.caikaProcess[index].showUserList = !this.data.caikaProcess[index].showUserList
        this.setData({
            caikaProcess: this.data.caikaProcess
        })
    },
    toggleHistoryList(e) {
        const index = e.currentTarget.dataset.index
        this.data.historyOaList[index].showUserList = !this.data.historyOaList[index].showUserList
        this.setData({
            historyOaList: this.data.historyOaList
        })
    },
    getCaikaProcessInstance(query) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'oaController.do?activityNodeList&billId=' + query.id,
            method: 'GET',
            success: res => {
                if(res.data) {
                    this.judgeShowOaOperate(res.data)
                    const caikaProcess = this.handleData(res.data)
                    this.setData({
                        // caikaProcess: caikaProcess.map(item => ({...item, showUserList: false}))
                        caikaProcess: caikaProcess.map(item => {
                            if(!item.children) {
                                return {
                                    ...item,
                                    assigneeNameSlice: item.assigneeName.slice(-2),
                                    showUserList: false,
                                }
                            }else{
                                item.children.forEach(item => {
                                    item.assigneeNameSlice = item.assigneeName.slice(-2)
                                })
                                return {
                                    ...item,
                                    showUserList: false,
                                }
                            }
                        })
                    })
                }
            }
        })
    },
    // 通过审批节点判断当前的人，如果是当前人，现实操作蓝，如果不是就不显示
    judgeShowOaOperate(oaList) {
        const result = oaList.some(item => item.status == 1 && item.assigneeName === (app.globalData.realName || wx.getStorageSync('realName')))
        this.setData({
            judgeShowOperate: result && this.data.submitOaData.id
        })
    },
    handleData(sourceArr) {
        var arr = [];
        if (sourceArr.length == 0 || sourceArr == undefined) {
            return arr;
        }
        //给数组添加排序编号
        for (var i = 0; i < sourceArr.length; i++) {
            sourceArr[i].no = i;
        }
        //根据下标排序
        var compare = function (property) {
            return function (a, b) {
                var value1 = a[property];
                var value2 = b[property];
                return value1 - value2;
            }
        }
        //获取对应数据
        var getSourceArr = function (sourceArr, removeArr) {
            if (removeArr.length == 0) {
                return;
            }
            var index = 0;
            //循环删除数据
            for (var i = 0; i < removeArr.length; i++) {
                var deindex = removeArr[i] - index;
                sourceArr.splice(deindex, 1);
                index++;
            }
        }
        //获取status=2的数据
        var status2 = [];
        var removeArr = [];
        for (var i = 0; i < sourceArr.length; i++) {
            var json = sourceArr[i];
            if (json.status == 2 && json.activityType == 'userTask') {
                status2.push(json);
                removeArr.push(i);
            }
        }
        //删除statues=2
        getSourceArr(sourceArr, removeArr);
        //构建剩余数据构建有相同的activityId
        var otherStatus = [];
        var tempArr = [];
        for (var i = 0; i < sourceArr.length; i++) {
            var json = sourceArr[i];
            if (tempArr.indexOf(json.activityId) == -1) {
                //先做成简单的对象，可以扩展对象属性
                otherStatus.push({
                    activityId: json.activityId,
                    activityName: json.activityName,
                    activityType: json.activityType,
                    signType: json.signType,
                    children: [json],
                    no: json.no,
                    status: json.status
                });
                tempArr.push(json.activityId);
            } else {
                for (var j = 0; j < otherStatus.length; j++) {
                    var other = otherStatus[j];
                    if (json.activityId == other.activityId) {
                        otherStatus[j].children.push(json);
                    }
                }
            }
        }
        var sameArr = [];
        var onlyArr = [];
        //拆开有children的和无children的
        for (var i = 0; i < otherStatus.length; i++) {
            let json = otherStatus[i];
            if (json.children.length == 1) {
                onlyArr.push(json.children[0]);
            } else {
                sameArr.push(json);
            }
        }
        //拼接数组
        arr = status2.concat(sameArr).concat(onlyArr);
        arr.sort(compare('no'));
        return arr;
    },
    // oa===============================
    onCommentShow(e) {
        const type = e.currentTarget.dataset.type
        this.setData({
            approvalType: type,
            submitOaData: {
                ...this.data.submitOaData,
                approveResult: type === 'reject' ? 0 : 1
            }
        })
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        animation.translateY(0).step()
        this.setData({
            animationInfo: animation.export(),
            maskHidden: false,
            dialogHidden: false
        })
    },
    onCommentHide() {
        this.setData({
            id: '',
            approveResult: '',
            comment: '',
            processInstanceId: ''
        })
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        animation.translateY('100%').step()
        this.setData({
            animationInfo: animation.export(),
            maskHidden: true
        })
        const t = setTimeout(() => {
            this.setData({
                dialogHidden: true
            })
            clearTimeout(t)
        }, 250)
    },
    commentInput(e) {
        this.setData({
            submitOaData: {
                ...this.data.submitOaData,
                comment: e.detail.value
            }
        })
    },
    setOaQuery(query) {
        this.setData({
            submitOaData: {
                ...this.data.submitOaData,
                id: query.oaId,
                processInstanceId: query.processInstanceId
            }
        })
    },
    submitOa() {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}oaTaskController.do?doProcess`,
            method: 'POST',
            data: this.data.submitOaData,
            success: res => {
                // 关闭弹框
                this.onCommentHide()
                if(res.data.success) {
                    if(this.data.query.isNotification) {
                        this.onLoad(this.data.query)
                    }else{
                        wx.navigateBack({
                            delta: 1
                        })
                    }
                }else{
                    wx.showModal({
                        content: res.data.msg,
                        confirmText: '确定',
                        showCancel: false,
                        success: res => {
                        }
                    })
                }
            }
        })
    },
    // oa===============================
    getProcessInstance(billId, accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'weixinController.do?getProcessinstanceJson&billType=9&billId=' + billId + '&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                if(res.data && res.data.length && typeof res.data !== 'string') {
                    const { operationRecords, ccUserids } = res.data[0]

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
                        item.userName = item.userid.split(',')[0]
                        item.avatar = item.userid.split(',')[1]
                        // if(item.operationType === 'START_PROCESS_INSTANCE') {
                        //     item.operationName = '发起审批'
                        // } else if(item.operationType !== 'NONE') {
                        //     item.operationName = '审批人'
                        // }
                        if(item.operationResult == 1) {
                            item.resultName = '（审批中）'
                        }else if(item.operationResult == 2) {
                            item.resultName = '（已同意）'
                        }else if(item.operationResult == 3){
                            item.resultName = '（已驳回）'
                        }else{
                            item.resultName = '（已转审）'
                        }
                        return item
                    })
                    this.setData({
                        process: {
                            operationRecords: operationArr,
                            cc
                        }
                    })
                }
            },
        })
    },
    showBaoxiaoDetail(e) {
        const index = e.currentTarget.dataset.index
        const tempData = clone(this.data.result.billDetailList[index])
        tempData.taxpayerType = this.data.result.accountbook.taxpayerType
        wx.setStorage({
            key: 'baoxiaoDetail',
            data: tempData,
            success: res => {
                wx.navigateTo({
                    url: '/pages/viewBaoxiaoDetail/index'
                })
            }
        })
    },
    // ==========================外币==========================
    getCurrencyTagByAccountbookId(result) {
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}accountbookController.do?isMultiCurrency&accountbookId=${result.accountbookId}`,
            method: 'GET',
            success: res => {
                if(res.statusCode == 200) {
                    this.setData({
                        multiCurrency: res.data.multiCurrency,
                    })
                    if(res.data.multiCurrency) {
                        this.getCurrencyTypeListByAccountbookId(result.accountbookId, result.currencyTypeId)
                        this.getBaseCurrencyNameByAccountbookId(result.accountbookId)
                        this.setData({
                            exchangeRate: result.exchangeRate
                        })
                        result.originApplicationAmount = formatNumber(Number(result.originApplicationAmount).toFixed(2))
                        result.originVerificationAmount = formatNumber(Number(result.originVerificationAmount).toFixed(2))
                        result.totalAmount = formatNumber(Number(result.totalAmount).toFixed(2))
                        result.originTotalAmount = formatNumber(Number(result.originTotalAmount).toFixed(2))
                        result.billDetailList.forEach(item => {
                            item.formatApplicationAmount = formatNumber(Number(item.originApplicationAmount).toFixed(2))
                        })
                        result.borrowBillList.forEach(item => {
                            item.formatApplicationAmount = formatNumber(Number(item.originApplicationAmount).toFixed(2))
                        })
                    }else{
                        result.applicationAmount = formatNumber(Number(result.applicationAmount).toFixed(2))
                        result.verificationAmount = formatNumber(Number(result.verificationAmount).toFixed(2))
                        result.totalAmount = formatNumber(Number(result.totalAmount).toFixed(2))
                        result.billDetailList.forEach(item => {
                            item.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2))
                        })
                        result.borrowBillList.forEach(item => {
                            item.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2))
                        })
                    }
                    this.setData({
                        result
                    })
                }
            },
        })
    },
    getCurrencyTypeListByAccountbookId(accountbookId, currencyTypeId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}currencyController.do?getCurrencyTypeList&accountbookId=${accountbookId}`,
            method: 'GET',
            success: res => {
                console.log(res, '币别列表。。。。。')
                if (res.statusCode == 200) {
                    var currencyTypeName = res.data.filter(item => item.id === currencyTypeId)[0].currencyName
                    this.setData({
                        currencyTypeName
                    })
                }
            },
        })
    },
    getReimbursementName(reimbursementType) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}reimbursementTypeController.do?getList`,
            method: 'GET',
            success: res => {
                if (res.statusCode == 200) {
                    var reimbursementName = res.data.filter(item => item.id == reimbursementType)[0].name
                    this.setData({
                        reimbursementName
                    })
                }
            },
        })
    },
    getBaseCurrencyNameByAccountbookId(accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}accountbookController.do?getBaseCurrencyInfo&accountbookId=${accountbookId}`,
            method: 'GET',
            success: res => {
                if (res.statusCode == 200) {
                    this.setData({
                        baseCurrencyName: res.data.baseCurrencyName
                    })
                }
            },
        })
    },
})
