import moment from 'moment';
import NP from 'number-precision'
import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {getErrorMessage, submitSuccess, formatNumber, request} from "../../util/getErrorMessage";

var app = getApp()
app.globalData.loadingCount = 0
Page({
    data: {
        // 增加申请人
        realName: '',
        // =============外币相关============
        multiCurrency: false,
        currencyTypeIndex: 0,
        currencyTypeList: [],
        exchangeRateDisabled: false,
        // 外币字段区分
        amountField: {
            borrowAmount: 'borrowAmount',
            formatBorrowAmount: 'formatBorrowAmount',
            amount: 'amount',
            formatAmount: 'formatAmount'
        },
        // =============审批流相关============
        oaModule: null,
        showOaUserNodeList: false,
        showOa: false,
        nodeList: [],
        nodeIndex: null,
        deptList: [],
        // 这个是"查看更多"点进去显示的当前审批节点的用户
        selectedUserList: [],
        animationInfo1: {},
        historyOaList: [],
        // =================================
        validT: null,
        isPhoneXSeries: false,
        process: null,
        type: '',
        billId: '',
        maskHidden: true,
        dialogHidden: true,
        btnHidden: false,
        disabled: false,
        hesuanMaskHidden: true,
        animationInfo: {},
        hesuanAnimationInfo: {},
        borrowAmount: '',
        formBorrowAmount: '',
        // 外币字段
        originBorrowAmount: '',
        originFormatBorrowAmount: '',
        remark: '',
        accountbookIndex: 0,
        accountbookList: [],
        departmentIndex: 0,
        departmentList: [],
        borrowIndex: 0,
        borrowList: [],
        incomeBankIndex: 0,
        incomeBankList: [],
        numberPattern: /^(\+)?\d+(\.\d+)?$/,
        // 资金计划列表
        capitalTypeIndex: 0,
        applicantIndex: 0,
        applicantType: [
            {
                id: 10,
                name: '职员'
            },
            {
                id: 20,
                name: '供应商'
            },
            {
                id: 30,
                name: '客户'
            }
        ],
        // 科目下挂着的辅助核算
        subjectAuxptyList: [],
        // 辅助核算列表(所有)
        allAuxptyList: {},
        // 选择的辅助核算
        selectedAuxpty: null,
        isCapitalTypeStart: false,
        submitData: {
            billApEntityListObj: [],
            billDetailListObj: [],
            billFilesObj: [],
            submitDate: moment().format('YYYY-MM-DD'),
            applicantType: 10,
            invoice: 0,
            auxpropertyNames: '',
            businessDateTime: moment().format('YYYY-MM-DD'),
            amount: 0,
            status: 20,
            userName: '',
            billCode: '',
            remark: '',
            // 外币
            baseCurrencyName: '',
            baseCurrency: '',
            exchangeRate: '',
            currencyTypeId: '',
        }
    },
    formatSubmitData(array, name) {
        if (!!array && array.length) {
            array.forEach((item, index) => {
                Object.keys(item).forEach(keys => {
                    this.setData({
                        submitData: {
                            ...this.data.submitData,
                            [`${name}[${index}].${keys}`]: item[keys]
                        }
                    })
                })
            })
        }
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
    formSubmit(e) {
        // ============= 处理外币提交=================
        if(!this.data.submitData.isMultiCurrency) {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    isMultiCurrency: 0
                }
            })
        }
        // ============= 处理外币提交=================
        // ==================处理审批流数据==================
        if(this.data.nodeList.length) {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    oaBillUserNodeListJson: JSON.stringify(this.data.nodeList)
                }
            })
        }
        // ==================处理审批流数据==================
        const status = e.currentTarget.dataset.status
        this.setData({
            submitData: {
                ...this.data.submitData,
                status
            }
        })
        // 删除辅助核算的信息，然后通过formatSubmitData重新赋值
        Object.keys(this.data.submitData).forEach(item => {
            if (item.indexOf('billApEntityList[') !== -1) {
                delete this.data.submitData[item]
            }
        })
        // 处理一下提交格式
        this.formatSubmitData(this.data.submitData.billDetailListObj, 'billDetailList')
        this.formatSubmitData(this.data.submitData.billApEntityListObj, 'billApEntityList')
        this.formatSubmitData(this.data.submitData.billFilesObj, 'billFiles')
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
        console.log(this.data)
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
        this.addLoading()
        var url = ''
        if (this.data.type === 'add') {
            url = app.globalData.url + 'borrowBillController.do?doAdd'
        } else {
            url = app.globalData.url + 'borrowBillController.do?doUpdate&id=' + this.data.billId
        }
        // 处理一下 null 变成字符串的问题
        const submitData = clone(this.data.submitData)
        for(let i in submitData) {
            if(submitData[i] == null) {
                delete submitData[i]
            }
        }
        request({
            hideLoading: this.hideLoading,
            url,
            method: 'POST',
            data: submitData,
            success: res => {
                if (res.data && typeof res.data == 'string') {
                    getErrorMessage(res.data)
                }
                // 提交成功
                if (res.data.success) {
                    submitSuccess()
                }
            },
            fail: res => {
                if (res.data && typeof res.data == 'string') {
                    getErrorMessage(res.data)
                }
            },
        })
    },
    radioChange(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                invoice: e.detail.value ? 1 : 0
            }
        })
    },
    bindObjPickerChange(e) {
        var name = e.currentTarget.dataset.name
        var listName = e.currentTarget.dataset.list
        var value = e.detail.value
        var index = e.currentTarget.dataset.index
        // 设置当前框的值
        if (name !== 'incomeBankName') {
            this.setData({
                [index]: e.detail.value,
                submitData: {
                    ...this.data.submitData,
                    [name]: this.data[listName][value].id
                }
            })
        } else {
            this.setData({
                [index]: e.detail.value,
                submitData: {
                    ...this.data.submitData,
                    [name]: this.data[listName][value].bankName
                }
            })
        }
        // --------------------------------------------------------
        if (name === 'accountbookId') {
            // 删除借款详情
            this.clearBillDetailList()
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'billDetailListObj'])
            this.clearSubjectData()
            this.setData({
                applicantIndex: 0,
                submitData: {
                    ...this.data.submitData,
                    applicantType: 10
                }
            })
            // ============ 审批流 =========
            this.setData({
                oaModule: this.findAccountbookOaModule(this.data[listName][value].id, this.data.accountbookList)
            })
            this.showOaProcessByBillType(this.data[listName][value].id, 4)
            // ============ 审批流 =========
            this.getDepartmentList(this.data[listName][value].id)
            this.getBorrowBillList(this.data[listName][value].id, 10, null, null, true)
            this.isCapitalTypeStart(this.data[listName][value].id)
            // =============外币============
            this.initCurrency(this.data[listName][value].id)
            // =============外币============
        }
        // =============外币============
        if(name === 'currencyTypeId') {
            this.getExchangeRate({
                accountbookId: this.data.submitData.accountbookId,
                currencyTypeId: this.data[listName][value].id,
                businessDateTime: this.data.submitData.businessDateTime
            })
        }
        // =============外币============
        if (name === 'submitterDepartmentId') {
            this.clearSubjectData()
            this.setData({
                applicantIndex: 0
            })
            this.getBorrowBillList(this.data.submitData.accountbookId, 10, null, null, true)
            this.getSubjectList(this.data.submitData.accountbookId, this.data[listName][value].id)
        }
        // if (name === 'subjectId') {
        //     this.getSubjectAuxptyList(this.data[listName][value].id, this.data.submitData.accountbookId, true)
        // }
        if (name === 'applicantType') {
            // this.getSubjectAuxptyList(this.data.submitData.subjectId, this.data.submitData.accountbookId)
            // uisCurrentUser 判断是否应该选择当前登录的用户的applicantId
            var isCurrentUser = true
            if (this.data[listName][value].id !== 10) {
                isCurrentUser = false
            }
            this.getBorrowBillList(this.data.submitData.accountbookId, this.data[listName][value].id, null, null, isCurrentUser)
        }
        if (name === 'applicantId') {
            this.getIncomeBankList(this.data.submitData.applicantType, this.data[listName][value].id)
        }
        if (name === 'incomeBankName') {
            this.setIncomeBankAccount(this.data[listName][value].bankAccount)
        }
        // if (name === 'capitalTypeDetailId') {
        //     this.setCapitalType(this.data[listName][value].detailId)
        // }
    },
    bindblur(e) {
        console.log(e, 'blur')
        this.setData({
            submitData: {
                ...this.data.submitData,
                [e.currentTarget.dataset.name]: e.detail.value
            },
        })
    },
    clearBillDetailList() {
        this.clearListSubmitData(this.data.submitData, 'billDetailList')
        this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'billDetailListObj'])
        this.setData({
            submitData: {
                ...this.data.submitData,
                billDetailListObj: [],
                amount: '',
                originAmount: '',
                formatAmount: '',
                originFormatAmount: '',
                totalAmount: '',
                formatTotalAmount: ''
            }
        })
    },
    clearSubjectData() {
        // 清空科目数据，当这个发生变化的时候
        this.setData({
            submitData: {
                ...this.data.submitData,
                subjectId: '',
                subjectName: ''
            },
            selectedAuxpty: null,
            subjectAuxptyList: [],
        })
    },
    clearCurrencyData(data) {
        if(data) {
            // 外币
            var billDetailListObj = []
            if (data.billDetailList && data.billDetailList.length) {
                billDetailListObj = data.billDetailList.map(item => {
                    return {
                        borrowAmount: item.borrowAmount,
                        formatBorrowAmount: formatNumber(Number(item.borrowAmount).toFixed(2)),
                        originBorrowAmount: '',
                        originFormatBorrowAmount: '',
                        remark: item.remark
                    }
                })
                this.setData({
                    submitData: {
                        ...this.data.submitData,
                        billDetailListObj
                    }
                })
            }
        }
        // 清除外币字段
        this.setData({
            currencyTypeIndex: 0,
            currencyTypeList: [],
            exchangeRateDisabled: false,
            submitData: {
                ...this.data.submitData,
                isMultiCurrency: null,
                baseCurrency: '',
                baseCurrencyName: '',
                currencyTypeId: '',
                originAmount: '',
                originFormatAmount: '',
            }
        })
    },
    onBusinessFocus(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                businessDateTime: e.detail.value
            }
        })
        // ============外币相关=============
        this.getExchangeRate({
            accountbookId: this.data.submitData.accountbookId,
            businessDateTime: this.data.submitData.businessDateTime,
            currencyTypeId: this.data.submitData.currencyTypeId
        })
        // ============外币相关=============
        this.onClick()
    },
    onClick() {
        console.log('onClick')
    },
    onAddShow(index) {
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
        if (index >= 0) {
            this.setData({
                [this.data.amountField.borrowAmount]: this.data.submitData.billDetailListObj[index][this.data.amountField.borrowAmount],
                [this.data.amountField.formatBorrowAmount]: formatNumber(this.data.submitData.billDetailListObj[index][this.data.amountField.borrowAmount]),
                remark: this.data.submitData.billDetailListObj[index].remark
            })
        } else {
            this.setData({
                [this.data.amountField.borrowAmount]: '',
                [this.data.amountField.formatBorrowAmount]: '',
                remark: ''
            })
        }
    },
    onAddHide() {
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
    getBorrowIdFromStorage() {
        // 从缓存里获取借款人id
        const borrowId = wx.getStorageSync('borrowId')
        console.log(borrowId, '---------------')
        if (!!borrowId) {
            console.log('借款人id已经获取', borrowId)
            var borrowIndex = null
            this.data.borrowList.forEach((item, index) => {
                if (item.id === borrowId) {
                    borrowIndex = index
                }
            })
            this.setData({
                borrowIndex,
                submitData: {
                    ...this.data.submitData,
                    applicantId: borrowId
                }
            })
            this.getSubjectAuxptyList(this.data.submitData.subjectId, this.data.submitData.accountbookId)
            this.getIncomeBankList(this.data.submitData.applicantType, borrowId)
        }
    },
    getAuxptyIdFromStorage() {
        // 从缓存里获取auxpty
        const auxpty = wx.getStorageSync('auxpty')
        console.log(auxpty, '..................')
        if (!!auxpty) {
            this.setSelectedAuxpty(auxpty)
            wx.removeStorage({
                key: 'auxpty'
            })
        }
    },
    getSubjectIdFromStorage() {
        // 从缓存里获取科目id
        const subject = wx.getStorageSync('subject')
        if (!!subject && subject !== null) {
            this.setData({
                selectedAuxpty: null,
                submitData: {
                    ...this.data.submitData,
                    subjectId: subject.id,
                    subjectName: subject.name,
                    billApEntityListObj: []
                }
            })
            wx.removeStorage({
                key: 'subject'
            })
            this.getSubjectAuxptyList(subject.id, this.data.submitData.accountbookId)
        }
    },
    getCapitalDetailIdFromStorage() {
        // 从缓存里获取科目id
        const capital = wx.getStorageSync('capital')
        console.log(capital, 'apital')
        if (!!capital && capital !== null) {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    capitalTypeDetailId: capital.id,
                    capitalTypeDetailName: capital.name
                }
            })
            wx.removeStorage({
                key: 'capital'
            })
        }
    },
    onHide() {
        // 清理借款人缓存
        wx.removeStorage({
            key: 'borrowId',
            success: function () {
                console.log('借款人缓存删除成功')
            }
        });
    },
    onShow() {
        this.getSelectedUserListFromStorage()
        this.getAuxptyIdFromStorage()
        this.getBorrowIdFromStorage()
        this.getSubjectIdFromStorage()
        this.getCapitalDetailIdFromStorage()

        // 页面显示
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        this.setData({
            animationInfo: animation.export()
        })
    },
    bindExchangeRateInput(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                exchangeRate: e.detail.value
            }
        })
        this.data.submitData.originAmount && this.calculateExchangeRate(this.data.submitData.originAmount)
    },
    bindKeyInput(e) {
        console.log(this.data.numberPattern)
        if(!!this.data.validT) {
            clearTimeout(this.data.validT)
        }
        this.data.validT = setTimeout(() => {
            if(!/^(\+)?\d+(\.\d+)?$/.test(e.detail.value)) {
                wx.showToast({
                    title: '请输入正确的数字',
                    icon: 'none',
                });
                return
            }
        }, 300)
        // 借款详情
        if (e.currentTarget.dataset.type === this.data.amountField.borrowAmount) {
            this.setData({
                [this.data.amountField.borrowAmount]: e.detail.value,
                [this.data.amountField.formatBorrowAmount]: formatNumber(Number(e.detail.value).toFixed(2))
            })
        }
        // 备注
        if (e.currentTarget.dataset.type === 'remark') {
            this.setData({
                remark: e.detail.value
            })
        }
    },
    // 删除得时候把submitData里面之前存的报销列表数据清空
    clearListSubmitData(submitData, name) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf(name) !== -1) {
                delete submitData[key]
            }
        })
    },
    editBorrowDetail(e) {
        const index = e.currentTarget.dataset.index
        wx.setStorage({
            key: 'borrowAmountIndex',
            data: index,
            success: res => {
                this.onAddShow(index)
            }
        })
    },
    deleteBorrowDetail(e) {
        var borrowAmount = e.currentTarget.dataset.detail
        var billDetailListObj = this.data.submitData['billDetailListObj'].filter(item => {
            return item[this.data.amountField.borrowAmount] !== borrowAmount
        })
        this.clearListSubmitData(this.data.submitData, 'billDetailList')
        // 外币 汇率计算
        if(this.data.multiCurrency) {
            this.calculateExchangeRate(Number(this.data.submitData[this.data.amountField.amount]) - Number(borrowAmount))
        }
        this.setData({
            submitData: {
                ...this.data.submitData,
                billDetailListObj,
                [this.data.amountField.amount]: Number(this.data.submitData[this.data.amountField.amount]) - Number(borrowAmount),
                [this.data.amountField.formatAmount]: formatNumber((Number(this.data.submitData[this.data.amountField.amount]) - Number(borrowAmount)).toFixed(2))
            }
        })
        this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'billDetailListObj'])
    },
    deleteFile(e) {
        var file = e.currentTarget.dataset.file
        var fileList = this.data.submitData.billFilesObj.filter(item => {
            return item.name !== file
        })
        this.clearListSubmitData(this.data.submitData, 'billFiles')
        this.setData({
            submitData: {
                ...this.data.submitData,
                billFilesObj: fileList
            }
        })
    },
    calculateExchangeRate(origin) {
        var exchangeRate = this.data.submitData.exchangeRate
        var value = NP.divide(origin, exchangeRate)
        this.setData({
            submitData: {
                ...this.data.submitData,
                amount: value,
                formatAmount: formatNumber(Number(value).toFixed(2))
            }
        })
    },
    handleAddBorrow() {
        const borrowAmountIndex = wx.getStorageSync('borrowAmountIndex')
        const numberReg = /^\d+(\.\d+)?$/
        if (this.data[this.data.amountField.borrowAmount] === '' || !numberReg.test(this.data[this.data.amountField.borrowAmount])) {
            wx.showModal({
                content: '请输入合法的借款金额',
                confirmText: '确定',
                showCancel: false,
                success: res => {
                }
            })
            return
        }
        var obj = {
            [this.data.amountField.borrowAmount]: Number(this.data[this.data.amountField.borrowAmount]).toFixed(2),
            [this.data.amountField.formatBorrowAmount]: formatNumber(Number(this.data[this.data.amountField.borrowAmount]).toFixed(2)),
            remark: this.data.remark
        }
        var billDetailListObj = []
        console.log(typeof borrowAmountIndex, 'borrowAmountIndex')
        if (typeof borrowAmountIndex === 'number') {
            billDetailListObj = clone(this.data.submitData['billDetailListObj'])
            billDetailListObj.splice(borrowAmountIndex, 1, obj)
            wx.removeStorage({
                key: 'borrowAmountIndex'
            })
        } else {
            billDetailListObj = this.data.submitData['billDetailListObj'].concat(obj)
        }
        // 借款合计
        var amount = 0
        billDetailListObj.forEach(item => {
            amount += Number(item[this.data.amountField.borrowAmount])
        })
        this.setData({
            submitData: {
                ...this.data.submitData,
                billDetailListObj,
                [this.data.amountField.amount]: amount,
                [this.data.amountField.formatAmount]: formatNumber(Number(amount).toFixed(2)),
            }
        })
        // 外币 汇率计算
        if(this.data.multiCurrency) {
            this.calculateExchangeRate(amount)
        }
        this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'billDetailListObj'])
        this.onAddHide()
    },
    handleUpload() {
        wx.chooseImage({
            count: 9,
            success: res => {
                this.uploadFile(res.tempFilePaths)
            },
            fail: res => {
                console.log('用户取消操作')
            }
        })
    },
    /**
     *
     * @param 上传图片字符串列表
     */
    uploadFile(array) {
        if (array.length) {
            let promiseList = []
            array.forEach(item => {
                promiseList.push(new Promise((resolve, reject) => {
                    this.addLoading()
                    wx.uploadFile({
                        url: app.globalData.url + 'aliyunController/uploadImages.do',
                        name: item,
                        filePath: item,
                        formData: {
                            accountbookId: this.data.submitData.accountbookId,
                            submitterDepartmentId: this.data.submitData.submitterDepartmentId
                        },
                        success: res => {
                            console.log(res.data, '上传')
                            const result = JSON.parse(res.data)
                            if (result.obj && result.obj.length) {
                                const file = result.obj[0]
                                resolve(file)
                            } else {
                                reject('上传失败')
                            }
                        },
                        fail: res => {
                            console.log(res, '.........')
                            reject(res)
                        },
                        complete: res => {
                            this.hideLoading()
                        }
                    })
                }))
            })
            Promise.all(promiseList).then(res => {
                // 提交成功的处理逻辑
                var billFilesList = []
                res.forEach(item => {
                    console.log(item, '上传成功的文件')
                    const obj = {
                        name: item.name,
                        uri: item.uri,
                        size: item.size
                    }
                    billFilesList.push(obj)
                })
                this.setData({
                    submitData: {
                        ...this.data.submitData,
                        billFilesObj: this.data.submitData.billFilesObj.concat(billFilesList)
                    }
                })
            }).catch(error => {
                console.log(error, 'catch')
                wx.showModal({
                    content: '上传失败',
                    confirmText: '好的',
                    showCancel: false,
                    success: res => {
                        console.log(res, '上传失败')
                    }
                })
            })
        }
    },
    previewFile(e) {
        var url = e.currentTarget.dataset.url
        wx.previewImage({
            urls: [url],
        })
    },
    onLoad(query) {
        // 增加申请人
        this.setData({
            realName: app.globalData.realName
        })
        app.globalData.loadingCount = 0
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries,
            submitData: {
                ...this.data.submitData,
                userName: app.globalData.realName,
                applicantId: app.globalData.applicantId
            }
        })
        var type = query.type
        this.setData({
            type
        })
        var id = query.id
        this.setData({
            billId: id
        })
        // 获取账簿列表
        if (type === 'add') {
            this.getAccountbookList()
        }
        if (type === 'edit') {
            // 渲染
            this.getEditData(id)
            // oa=============================
            this.getHistoryOaList(query)
            // oa=============================
        }
    },
    // =============================================================================
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
                        historyOaList: historyOaList.map(item => ({...item, showUserList: false, showAssigneeName: item.assigneeName.slice(-2)}))
                    })
                    console.log(this.data.historyOaList)
                }
            }
        })
    },
    toggleHistoryList(e) {
        const index = e.currentTarget.dataset.index
        this.data.historyOaList[index].showUserList = !this.data.historyOaList[index].showUserList
        this.setData({
            historyOaList: this.data.historyOaList
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
    findAccountbookOaModule(accountbookId, accountbookList) {
        return accountbookList.filter(item => item.id === accountbookId)[0].oaModule
    },
    // 通过单据判断
    showOaProcessByBillType(accountbookId, billType) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'oaBillConfigController.do?getEnableStatus&accountbookId=' + accountbookId + '&billType=' + billType,
            method: 'GET',
            success: res => {
                this.setData({
                    showOaUserNodeList: res.data
                })
            }
        })
    },
    showOaUserNodeListUseField(fields){
        let result = false
        result = fields.every(field => {
            const fieldValue = this.data.submitData[field]
            if(Array.isArray(fieldValue)) {
                return fieldValue.length
            }else{
                return !!fieldValue
            }
        })
        console.log(result, 'result..........')
        if(this.data.oaModule && this.data.showOaUserNodeList && result) {
            this.setData({
                showOa: true
            })
            this.getProcess(fields, 4)
        }else{
            this.setData({
                showOa: false
            })
        }
    },
    getOaParams(fields, billType) {
        let params = ''
        fields.forEach(item => {
            if(Array.isArray(this.data.submitData[item])) {
                let amount = 0
                this.data.submitData[item].forEach(obj => {
                    amount += Number(obj[this.data.amountField.borrowAmount])
                })
                params += '&amount=' + amount
            }else{
                params += '&' + item + '=' + this.data.submitData[item]
            }
        })
        params = '&billType=' + billType + params
        return params
    },
    getProcess(fields) {
        const params = this.getOaParams(fields, 4)
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'oaBillConfigController.do?getOAUserList' + params,
            method: 'GET',
            success: res => {
                if(res.data && res.data.length) {
                    const nodeList = res.data.map(node => {
                        node.oaBillUserList = node.oaBillUserList ? node.oaBillUserList : []
                        return {
                            ...node,
                            oaBillUserList: this.handleUserName('showUserName', 'userName', node.oaBillUserList) || [],
                            showOaBillUserList: node.oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName',node.oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName', 'userName', node.oaBillUserList.slice(1)),
                            editable:node.editable,
                            allowMulti:node.allowMulti,
                            nodeTypeName:node.nodeType === 'serviceTask' ? '抄送' : '审批',
                            operate:node.signType === 'and' ? '+' : '/',
                            nodeName: node.nodeName
                        }
                    })
                    this.setData({nodeList})
                }
            },
        })
    },
    handleUserName(newKey, key, arr) {
        if(arr && arr.length) {
            return arr.map(item => ({
                ...item,
                [newKey]: item[key].slice(-2)
            }))
        }
        return []
    },
    setRenderProgress(nodeList) {
        const newNodeList = nodeList.map(node => {
            return {
                ...node,
                oaBillUserList: this.handleUserName('showUserName', 'userName', node.oaBillUserList) || [],
                showOaBillUserList: node.oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName',node.oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName', 'userName', node.oaBillUserList.slice(1)),
                editable:node.editable,
                allowMulti:node.allowMulti,
                nodeTypeName:node.nodeType === 'serviceTask' ? '抄送' : '审批',
                operate:node.signType === 'and' ? '+' : '/',
                nodeName: node.nodeName
            }
        })
        if(!!nodeList) {
            this.setData({
                nodeList: newNodeList,
                showOa: true
            })
        }
    },
    getDept(e) {
        const allowMulti = e.currentTarget.dataset.allowmulti
        const nodeIndex = e.currentTarget.dataset.index
        // 存一下是单选还是多选
        wx.setStorage({
            key: 'allowMulti',
            data: allowMulti
        })
        // 存一下是点的第几个node
        wx.setStorage({
            key: 'nodeIndex',
            data: nodeIndex
        })
        const accountbookId = this.data.submitData.accountbookId
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'newDepartDetailController.do?treeListWithUser&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                if(res && res.data) {
                    const users = this.setSearchArr(res.data)
                    const searchUserList = this.handleUsers(users)
                    wx.setStorageSync('searchUserList', searchUserList)
                    wx.setStorage({
                        key: 'deptList',
                        data: res.data,
                        success: () => {
                            wx.navigateTo({
                                url: '/pages/deptList/index'
                            })
                        }
                    })
                }
            }
        })
    },
    setSearchArr(deptList) {
        let users = []
        for(let i = 0; i < deptList.length; i++) {
            const dept = deptList[i]
            users.concat(this.generateUsername(dept, users))
        }
        return users
    },
    generateUsername(dept, users) {
        const userList = dept.userList || []
        const subDepartList = dept.subDepartList || []
        if(userList.length) {
            userList.forEach(item => {
                users.push(item)
            })
        }
        if(subDepartList.length) {
            subDepartList.forEach(subDepart => {
                users.concat(this.generateUsername(subDepart, users))
            })
        }
        return users
    },
    handleUsers(users) {
        const newUsers = []
        if(users.length) {
            const obj = {}
            users.reduce((prev, cur) => {
                obj[cur.id] ? '':obj[cur.id] = true && prev.push(cur)
                return prev
            }, newUsers)
        }
        return newUsers
    },
    removeUser(e) {
        const id = e.currentTarget.dataset.id
        const nodeIndex = e.currentTarget.dataset.index
        this.data.nodeList[nodeIndex].oaBillUserList = this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.filter(item => item.id !== id))
        this.data.nodeList[nodeIndex].showOaBillUserList = this.data.nodeList[nodeIndex].oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName','userName', this.data.nodeList[nodeIndex].oaBillUserList.slice(1))
        this.setData({
            nodeList: this.data.nodeList,
            nodeIndex,
            selectedUserList:this.data.nodeList[nodeIndex]
        })
    },
    getSelectedUserListFromStorage() {
        const selectedUsers = wx.getStorageSync('selectedUsers') || []
        const nodeIndex = wx.getStorageSync('nodeIndex')
        let currentNodeList = []
        if(selectedUsers.length && nodeIndex !== null) {
            currentNodeList = selectedUsers[nodeIndex].map(item => ({...item, removable: true}))
        }
        if(!!currentNodeList && nodeIndex !== null) {
            if(this.data.nodeList[nodeIndex]) {
                // 把用户刚选择的和之前已经选择的混合在一起
                this.data.nodeList[nodeIndex].oaBillUserList = this.data.nodeList[nodeIndex].oaBillUserList.concat(currentNodeList)
                // 然后去重
                this.data.nodeList[nodeIndex].oaBillUserList = this.handleUsers(this.data.nodeList[nodeIndex].oaBillUserList)
                this.data.nodeList[nodeIndex].oaBillUserList = this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList)
                this.data.nodeList[nodeIndex].showOaBillUserList = this.data.nodeList[nodeIndex].oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName', 'userName',this.data.nodeList[nodeIndex].oaBillUserList.slice(1))
                this.setData({
                    nodeList: this.data.nodeList,
                    nodeIndex: nodeIndex,
                    selectedUserList: this.data.nodeList[nodeIndex],
                })
            }
        }
        this.clearSelectedUserList()
    },
    clearSelectedUserList() {
        wx.removeStorage({key: 'selectedUsers'})
        wx.removeStorage({key: 'nodeIndex'})
    },
    showSelectedUserList(e) {
        const nodeIndex = e.currentTarget.dataset.index
        this.setData({
            selectedUserList: this.data.nodeList[nodeIndex],
            nodeIndex
        })
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        animation.translateY(0).step()
        this.setData({
            animationInfo1: animation.export(),
        })
    },
    hideSelectedUserList() {
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'linear'
        })
        this.animation = animation
        animation.translateY('100%').step()
        this.setData({
            animationInfo1: animation.export(),
        })
    },
    // ===============================================================================
    // 获取申请组织
    getAccountbookList(data) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'accountbookController.do?getAccountbooksJsonByUserId&corpId=' + app.globalData.corpId,
            method: 'GET',
            success: res => {
                console.log(res)
                if (res.data.success && res.data.obj.length) {
                    var accountbookIndex = 0
                    var accountbookId = !!data ? data.accountbookId : res.data.obj[0].id
                    // ============ 审批流 =========
                    this.setData({
                        oaModule: this.findAccountbookOaModule(accountbookId, res.data.obj)
                    })
                    this.showOaProcessByBillType(accountbookId, 4)
                    // ============ 审批流 =========
                    // ============ 外币 =========
                    const currencyTypeId = !!data && data.currencyTypeId ? data.currencyTypeId : undefined
                    const exchangeRate = !!data && data.exchangeRate ? data.exchangeRate : undefined
                    this.initCurrency(accountbookId, currencyTypeId, exchangeRate, data)
                    // ============ 外币 =========
                    // edit的时候设置值
                    if (accountbookId) {
                        res.data.obj.forEach((item, index) => {
                            if (item.id === accountbookId) {
                                accountbookIndex = index
                            }
                        })
                    }
                    this.setData({
                        accountbookList: res.data.obj,
                        accountbookIndex: accountbookIndex,
                        submitData: {
                            ...this.data.submitData,
                            accountbookId
                        }
                    })
                    var submitterDepartmentId = data ? data.submitterDepartmentId : ''
                    var applicantType = data ? data.applicantType : 10
                    var applicantId = data ? data.applicantId : ''
                    var applicantIndex = 0
                    this.data.applicantType.forEach((item, index) => {
                        if (item.id === applicantType) {
                            applicantIndex = index
                        }
                    })
                    this.setData({
                        applicantIndex
                    })
                    var incomeBankName = data ? data.incomeBankName : ''
                    var subjectId = data ? data.subjectId : ''
                    var capitalTypeDetailId = data ? data.capitalTypeDetailId : null
                    this.getBorrowBillList(accountbookId, applicantType, applicantId, incomeBankName, true)
                    this.getDepartmentList(accountbookId, submitterDepartmentId, subjectId)
                    this.isCapitalTypeStart(accountbookId, capitalTypeDetailId)
                } else {
                    wx.showModal({
                        content: res.data.msg,
                        confirmText: '好的',
                        showCancel: false,
                        success: res => {
                            wx.reLaunch({
                                url: '/pages/index/index'
                            })
                        }
                    })
                }
            },
        })
    },
    // 获取申请部门
    getDepartmentList(accountbookId, departmentId, subjectId) {
        this.addLoading()
        console.log(app.globalData.url + 'newDepartController.do?departsJson&accountbookId=' + accountbookId + '-')
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'newDepartController.do?departsJson&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                console.log(res, '部门')
                console.log(departmentId, 'departmentId')
                if (res.data && res.data.length) {
                    var arr = res.data.map(item => {
                        return {
                            id: item.departDetail.id,
                            name: item.departDetail.depart.departName
                        }
                    })
                    // edit 的时候设置departmentIndex
                    var departmentIndex = 0
                    var submitterDepartmentId = !!departmentId ? departmentId : arr[0].id
                    if (submitterDepartmentId) {
                        arr.forEach((item, index) => {
                            if (item.id === submitterDepartmentId) {
                                departmentIndex = index
                            }
                        })
                    }
                    this.setData({
                        departmentList: arr,
                        departmentIndex: departmentIndex,
                        submitData: {
                            ...this.data.submitData,
                            submitterDepartmentId
                        }
                    })
                    this.getSubjectList(accountbookId, submitterDepartmentId, subjectId)
                } else {
                    wx.showModal({
                        content: '当前用户未设置部门或者所属部门已禁用',
                        confirmText: '好的',
                        showCancel: false,
                        success: res => {
                            wx.reLaunch({
                                url: '/pages/index/index'
                            })
                        }
                    })
                }
            },
        })
    },
    // 获取借款单位
    getBorrowBillList(accountbookId, applicantType, applicant, incomeBankName, isCurrentUser) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'borrowBillController.do?borrowerObjectList&accountbookId=' + accountbookId + '&applicantType=' + applicantType,
            method: 'GET',
            success: res => {
                var arr = res.data.map(item => {
                    return {
                        id: item.applicantId,
                        name: item.borrowObject
                    }
                })
                // 写入缓存
                wx.setStorage({
                    key: 'borrowList',
                    data: arr,
                    success: res => {
                    }
                })
                // edit的时候，设置borrowIndex
                var borrowIndex = 0
                var applicantId = ''
                if (isCurrentUser) {
                    applicantId = !!applicant ? applicant : app.globalData.applicantId
                } else {
                    applicantId = arr[0].id
                }
                console.log(applicantId, '.........')
                console.log(app.globalData.applicantId)
                if (applicantId) {
                    arr.forEach((item, index) => {
                        if (item.id === applicantId) {
                            borrowIndex = index
                        }
                    })
                }

                this.setData({
                    borrowList: arr,
                    borrowIndex: borrowIndex,
                    submitData: {
                        ...this.data.submitData,
                        applicantId
                    }
                })
                this.getIncomeBankList(applicantType, applicantId, incomeBankName)
            },
        })
    },
    // 获取收款银行
    getIncomeBankList(applicantType, applicantId, incomeBankName) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'incomeBankInfoController.do?listInfo&applicantType=' + applicantType + '&applicantId=' + applicantId,
            method: 'GET',
            success: res => {
                var arr = res.data.obj
                // edit的时候，设置incomeBankIndex
                var incomeBankIndex = 0
                var bankName = ''
                if (arr.length) {
                    bankName = !!incomeBankName ? incomeBankName : arr[0].bankName
                } else {
                    bankName = !!incomeBankName ? incomeBankName : ''
                }
                if (bankName) {
                    arr.forEach((item, index) => {
                        if (item.bankName === bankName) {
                            incomeBankIndex = index
                        }
                    })
                }
                if (!!arr.length) {
                    this.setData({
                        incomeBankList: arr,
                        incomeBankIndex: incomeBankIndex,
                        submitData: {
                            ...this.data.submitData,
                            incomeBankName: bankName
                        }
                    })
                    this.setIncomeBankAccount(arr[0].bankAccount)
                } else {
                    this.setData({
                        incomeBankList: [],
                        incomeBankIndex: 0,
                        submitData: {
                            ...this.data.submitData,
                            incomeBankName: ''
                        }
                    })
                    this.setIncomeBankAccount('')
                }
            },
        })
    },
    // 获取科目类型
    getSubjectList(accountbookId, departId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'subjectController.do?combotree&accountbookId=' + accountbookId + '&departId=' + departId + '&billTypeId=4&findAll=false',
            method: 'GET',
            success: res => {
                console.log(res, '借款类型')
                var arr = []
                if (res.data.length) {
                    res.data.forEach(item => {
                        if (!item.childrenCount) {
                            arr.push({
                                id: item.id,
                                name: item.text
                            })
                        }
                    })
                    // 写入缓存
                    wx.setStorage({
                        key: 'subjectList',
                        data: arr,
                        success: res => {
                            console.log('写入科目成功....')
                        }
                    })
                } else {
                    // 写入缓存
                    wx.setStorage({
                        key: 'subjectList',
                        data: [],
                        success: res => {
                            console.log('写入科目成功....')
                        }
                    })
                }
            },
        })
    },
    // 获取科目对应的辅助核算
    getSubjectAuxptyList(subjectId, accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'subjectStartDetailController.do?getInfo&subjectId=' + subjectId + '&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                if (!!res.data.obj && !!res.data.obj.subjectAuxptyList.length) {
                    var arr = res.data.obj.subjectAuxptyList.map(item => {
                        return {
                            auxptyId: item.auxptyId,
                            auxptyName: item.auxpropertyConfig.auxptyName
                        }
                    })
                    this.setData({
                        subjectAuxptyList: arr,
                    })
                    arr.forEach(item => {
                        this.getAuxptyList(accountbookId, item.auxptyId)
                    })
                } else {
                    this.setData({
                        subjectAuxptyList: [],
                        allAuxptyList: []
                    })
                }
            },
        })
    },
    // 设置收款账号
    setIncomeBankAccount(account) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                incomeBankAccount: account
            }
        })
    },
    checkFocus() {
        this.onHesuanShow()
    },
    // 辅助核算请求url分类
    getAuxptyUrl(accountbookId, auxptyid) {
        var url = ''
        switch (auxptyid) {
            case "1":
                // 部门
                url = "newDepartDetailController.do?datagrid&field=id,depart.departName&status=1&depart.departStatus=1&accountbookId=" + accountbookId
                break
            case "2":
                // 职员
                url = "userController.do?datagrid&field=id,realName&accountbookIds=" + accountbookId
                break
            case "3":
                // 供应商
                url = "supplierDetailController.do?datagrid&field=id,supplier.supplierName&status=1&accountbookId=" + accountbookId
                break
            case "4":
                // 客户
                url = "customerDetailController.do?datagrid&field=id,customer.customerName&customerStatus=1&accountbookId=" + accountbookId
                break
            default:
                url = "auxpropertyDetailController.do?datagridByAuxpropertyPop&field=id,auxptyDetailName&auxptyId=" + auxptyid + "&accountbookId=" + accountbookId
        }
        return url
    },
    // 请求辅助核算列表
    getAuxptyList(accountbookId, auxptyid) {
        this.addLoading()
        let url = this.getAuxptyUrl(accountbookId, auxptyid)
        if (auxptyid == 2 && this.data.submitData.applicantType == 10) {
            url = url + '&id=' + this.data.submitData.applicantId
        }
        if (auxptyid == 3 && this.data.submitData.applicantType == 20) {
            url = url + '&id=' + this.data.submitData.applicantId
        }
        if (auxptyid == 4 && this.data.submitData.applicantType == 30) {
            url = url + '&id=' + this.data.submitData.applicantId
        }
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + url,
            method: 'GET',
            success: res => {
                const name = this.getAuxptyNameMap(auxptyid)
                const newObj = res.data.rows.map(item => {
                    return {
                        id: item.id,
                        name: item[name],
                        auxptyId: auxptyid
                    }
                })
                const tempData = clone(this.data.allAuxptyList)
                tempData[auxptyid] = newObj
                console.log(newObj, auxptyid)
                console.log(tempData)
                this.setData({
                    allAuxptyList: tempData
                })
                // 设置默认值
                let index = null
                if (auxptyid == 1) {
                    // 部门
                    let submitterDepartmentId = ''
                    if(this.data.selectedAuxpty && this.data.selectedAuxpty[auxptyid]) {
                        submitterDepartmentId = this.data.selectedAuxpty[auxptyid].id
                    }else{
                        submitterDepartmentId = this.data.submitData.submitterDepartmentId
                    }
                    index = this.setInitIndex(newObj, submitterDepartmentId)
                }
                if (auxptyid == 2 && this.data.submitData.applicantType == 10) {
                    index = this.setInitIndex(newObj, this.data.submitData.applicantId)
                }
                if (auxptyid == 3 && this.data.submitData.applicantType == 20) {
                    index = this.setInitIndex(newObj, this.data.submitData.applicantId)
                }
                if (auxptyid == 4 && this.data.submitData.applicantType == 30) {
                    index = this.setInitIndex(newObj, this.data.submitData.applicantId)
                }
                if (index !== null) {
                    this.setSelectedAuxpty(newObj[index])
                }
            },
        })
    },
    setSelectedAuxpty(auxpty) {
        this.setData({
            selectedAuxpty: {
                ...this.data.selectedAuxpty,
                [auxpty.auxptyId]: {
                    id: auxpty.id,
                    name: auxpty.name,
                    auxptyId: auxpty.auxptyId
                }
            }
        })
        const obj = Object.values(this.data.selectedAuxpty).map(item => {
            return {
                auxptyId: item.auxptyId,
                auxptyDetailId: item.id
            }
        })
        this.setData({
            submitData: {
                ...this.data.submitData,
                billApEntityListObj: obj
            }
        })
    },
    setInitIndex(newObj, id) {
        let initIndex = null
        newObj.forEach((item, index) => {
            if (item.id === id) {
                initIndex = index
            }
        })
        return initIndex
    },
    // 获取辅助核算名字的map
    getAuxptyNameMap(auxptyid) {
        var name = ''
        switch (auxptyid) {
            case "1":
                // 部门
                name = 'depart.departName'
                break
            case "2":
                // 职员
                name = 'realName'
                break
            case "3":
                // 供应商
                name = 'supplier.supplierName'
                break
            case "4":
                // 客户
                name = "customer.customerName"
                break
            default:
                name = "auxptyDetailName"
        }
        return name
    },
    // 资金计划列表
    getCapitalTypeList(capitalTypeDetailId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'capitalTypeDetailController.do?getList',
            method: 'GET',
            success: res => {
                var arr = res.data.obj.map(item => {
                    return {
                        id: item.id,
                        name: item.detailName
                    }
                })
                wx.setStorage({
                    key: 'capitalList',
                    data: arr,
                    success: res => {
                        console.log('资金计划写入成功...')
                    }
                })
                if (!!capitalTypeDetailId) {
                    arr.forEach(item => {
                        if (item.id === capitalTypeDetailId) {
                            this.setData({
                                submitData: {
                                    ...this.data.submitData,
                                    capitalTypeDetailName: item.name,
                                    capitalTypeDetailId: item.id
                                }
                            })
                        }
                    })
                }
            },
        })
    },
    setCapitalType(id) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                capitalTypeDetailId: id
            }
        })
    },
    // 判断资金计划是否启用
    isCapitalTypeStart(accountbookId, capitalTypeDetailId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + "accountbookController.do?getModuleIdsByAccountbookId&accountbookId=" + accountbookId,
            method: 'GET',
            dataType: 'json',
            success: res => {
                console.log(res, '是否启用')
                this.setData({
                    isCapitalTypeStart: res.data
                })
                if (!!res.data) {
                    this.getCapitalTypeList(capitalTypeDetailId)
                } else {
                    this.setData({
                        capitalTypeList: [],
                        capitalTypeIndex: 0
                    })
                }
            }
        })
    },
    // 请求编辑回显数据
    getEditData(id) {
        this.addLoading()
        console.log('===============================================')
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'borrowBillController.do?getDetail&id=' + id,
            method: 'GET',
            success: res => {
                console.log(res.data.obj)
                if (res.data.obj) {
                    this.setRenderData(res.data.obj)
                    this.getProcessInstance(id, res.data.obj.accountbookId)
                }
            },
        })
    },
    onDisabled() {
        wx.showToast({
            icon: 'none',
            title: '当前单据状态不可被编辑'
        });
    },
    // 回显数据设置
    setRenderData(data) {
        // 请求
        this.getAccountbookList(data)
        // billDetailList
        var billDetailListObj = []
        if (data.billDetailList && data.billDetailList.length) {
            billDetailListObj = data.billDetailList.map(item => {
                return {
                    borrowAmount: item.borrowAmount,
                    formatBorrowAmount: formatNumber(Number(item.borrowAmount).toFixed(2)),
                    remark: item.remark
                }
            })
        }
        // billApEntityList
        var billApEntityListObj = []
        if (data.billApEntityList && data.billApEntityList.length) {
            billApEntityListObj = data.billApEntityList.map(item => {
                return {
                    auxptyId: item.auxptyId,
                    auxptyDetailId: item.auxptyDetailId,
                    auxptyDetailName: item.auxptyDetailName
                }
            })
            const obj = {}
            billApEntityListObj.forEach(item => {
                obj[item.auxptyId] = {
                    auxptyId: item.auxptyId,
                    id: item.auxptyDetailId,
                    name: item.auxptyDetailName
                }
            })
            this.setData({
                selectedAuxpty: obj
            })
        }
        // subjectAuxptyList
        if (data.subject && data.subject.subjectAuxptyList.length) {
            const subjectAuxptyList = data.subject.subjectAuxptyList.map(item => {
                return {
                    auxptyId: item.auxptyId,
                    auxptyName: item.auxpropertyConfig.auxptyName
                }
            })
            this.setData({
                subjectAuxptyList
            })
        }
        // fileList
        if (data.billFiles.length) {
            var billFilesObj = data.billFiles.map(item => {
                return item
            })
        }
        // 请求科目下的辅助核算
        this.getSubjectAuxptyList(data.subjectId, data.accountbookId)

        // 设置数据
        this.setData({
            ...this.data,
            status: data.status,
            submitData: {
                ...this.data.submitData,
                billApEntityListObj,
                billDetailListObj,
                billFilesObj: billFilesObj || [],
                submitDate: moment().format('YYYY-MM-DD'),
                applicantType: data.applicantType,
                invoice: data.invoice,
                subjectId: data.subjectId,
                subjectName: data.subject ? data.subject.fullSubjectName : '',
                businessDateTime: data.businessDateTime.split(' ')[0],
                amount: data.amount.toFixed(2),
                formatAmount: formatNumber(data.amount),
                // 外币
                originAmount: data.originAmount,
                originFormatAmount: formatNumber(Number(data.originAmount).toFixed(2)),
                remark: data.remark,
                status: data.status,
                userName: app.globalData.realName,
                accountbookId: data.accountbookId,
                billCode: data.billCode
            }
        })
        let t = null
        t = setTimeout(() => {
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'billDetailListObj'])
            this.setRenderProgress(JSON.parse(data.oaBillUserNodeListJson))
            t = null
        })
    },
    goInfoList() {
        wx.navigateTo({
            url: '/pages/infoList/index'
        })
    },
    goSubjectPage() {
        const subjectList = wx.getStorageSync('subjectList')
        console.log(subjectList)
        if (subjectList.length) {
            wx.navigateTo({
                url: '/pages/subjectPage/index'
            })
        } else {
            wx.showModal({
                content: '未找到借款类型',
                confirmText: '好的',
                showCancel: false,
            })
        }
    },
    goCapitalPage() {
        wx.navigateTo({
            url: '/pages/capitalPage/index'
        })
    },
    goAuxptyPage(e) {
        const auxptyId = e.currentTarget.dataset.id
        console.log(auxptyId, 'id')
        wx.setStorage({
            key: 'auxptyList',
            data: this.data.allAuxptyList[auxptyId],
            success: res => {
                wx.navigateTo({
                    url: '/pages/auxptyPage/index'
                })
            }
        })
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
    },
    // 删除单据
    deleteBill() {
        // 写入缓存，回列表页的时候刷新列表
        wx.setStorage({
            key: 'query',
            data: {
                type: this.data.status,
                flag: 'J'
            }
        })
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该单据吗?',
            confirmText: '是',
            cancelText: '否',
            cancelColor: '#ff5252',
            success: res => {
                if (res.confirm) {
                    this.addLoading()
                    request({
                        hideLoading: this.hideLoading,
                        url: app.globalData.url + 'borrowBillController.do?doBatchDel&ids=' + this.data.billId,
                        method: 'GET',
                        success: res => {
                            console.log(res)
                            if (res.data.success) {
                                wx.navigateBack({
                                    delta: 1
                                })
                            } else {
                                wx.showModal({
                                    content: '借款单删除失败',
                                    confirmText: '好的',
                                    showCancel: false,
                                })
                            }
                        },
                    })
                }
            }
        })
    },
    getProcessInstance(billId, accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'weixinController.do?getProcessinstanceJson&billType=4&billId=' + billId + '&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                console.log(res, '审批流')
                if(res.data && res.data.length) {
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
    // onShareAppMessage() {
    //     return {
    //         title: '财咖借款单',
    //         desc: '财咖借款单测试',
    //         path: 'page/addJiekuan/index'
    //     };
    // },
    getCurrencyTagByAccountbookId(accountbookId) {
        return new Promise((resolve, reject) => {
            request({
                hideLoading: this.hideLoading,
                url: `${app.globalData.url}accountbookController.do?isMultiCurrency&accountbookId=${accountbookId}`,
                method: 'GET',
                success: res => {
                    if(res.statusCode == 200) {
                        resolve(res.data.multiCurrency)
                    }else{
                        resolve(false)
                    }
                },
            })
        })
    },
    getCurrencyTypeListByAccountbookId(accountbookId) {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: `${app.globalData.url}currencyController.do?getCurrencyTypeList&accountbookId=${accountbookId}`,
                method: 'GET',
                success: res => {
                    console.log(res, '币别列表。。。。。')
                    if(res.statusCode == 200) {
                        resolve(res.data)
                    }else{
                        resolve([])
                    }
                },
            })
        })
    },
    getBaseCurrencyNameByAccountbookId(accountbookId) {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: `${app.globalData.url}accountbookController.do?getBaseCurrencyInfo&accountbookId=${accountbookId}`,
                method: 'GET',
                success: res => {
                    if(res.statusCode == 200) {
                        resolve(res.data)
                    }else{
                        resolve([])
                    }
                },
            })
        })
    },
    getExchangeRate({accountbookId, businessDateTime, currencyTypeId}) {
        if(currencyTypeId === this.data.submitData.baseCurrency) {
            this.setData({
                exchangeRateDisabled:  true,
                submitData: {
                    ...this.data.submitData,
                    exchangeRate: 1
                }
            })
            this.data.submitData.originAmount && this.calculateExchangeRate(this.data.submitData.originAmount)
            return
        }
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}exchangeRateController.do?getAverageExchangeRate&accountbookId=${accountbookId}&businessDateTime=${businessDateTime}&currencyTypeId=${currencyTypeId}`,
            method: 'GET',
            success: res => {
                if(res.statusCode == 200) {
                    this.setData({
                        exchangeRateDisabled: false,
                        submitData: {
                            ...this.data.submitData,
                            exchangeRate: res.data.obj || 0
                        }
                    })
                    this.data.submitData.originAmount && this.calculateExchangeRate(this.data.submitData.originAmount)
                }
            },
        })
    },
    async initCurrency(accountbookId, currencyTypeId, exchangeRate, data) {
        const multiCurrency = await this.getCurrencyTagByAccountbookId(accountbookId)
        this.setData({
            multiCurrency: multiCurrency,
            amountField: {
                borrowAmount: multiCurrency ? 'originBorrowAmount' : 'borrowAmount',
                amount: multiCurrency ? 'originAmount' : 'amount',
                formatBorrowAmount: multiCurrency ? 'originFormatBorrowAmount' : 'formatBorrowAmount',
                formatAmount: multiCurrency ? 'originFormatAmount' : 'formatAmount',
            }
        })
        if(multiCurrency) {
            const currencyTypeList = await this.getCurrencyTypeListByAccountbookId(accountbookId)
            let currencyType = currencyTypeList[0].id
            let currencyTypeIndex = 0
            if(currencyTypeId) {
                currencyTypeList.forEach((item, index) => {
                    if(item.id == currencyTypeId) {
                        currencyType = item.id
                        currencyTypeIndex = index
                    }
                })
            }
            this.setData({
                currencyTypeList,
                currencyTypeIndex,
                submitData: {
                    ...this.data.submitData,
                    currencyTypeId: currencyType,
                    isMultiCurrency: 1
                }
            })
            const baseCurrencyInfo = await this.getBaseCurrencyNameByAccountbookId(accountbookId)
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    baseCurrencyName: baseCurrencyInfo.baseCurrencyName,
                    baseCurrency: baseCurrencyInfo.baseCurrency
                }
            })
            if(!exchangeRate) {
                this.getExchangeRate({
                    accountbookId,
                    currencyTypeId: currencyType,
                    businessDateTime: this.data.submitData.businessDateTime,
                })
            }else{
                if(currencyType === this.data.submitData.baseCurrency) {
                    this.setData({
                        exchangeRateDisabled:  true,
                        submitData: {
                            ...this.data.submitData,
                            exchangeRate: 1
                        }
                    })
                }else{
                    this.setData({
                        submitData: {
                            ...this.data.submitData,
                            exchangeRate
                        }
                    })
                }
            }
            // billDetailList
            // 外币
            var billDetailListObj = []
            if (data && data.billDetailList && data.billDetailList.length) {
                billDetailListObj = data.billDetailList.map(item => {
                    return {
                        originBorrowAmount: item.originBorrowAmount ? item.originBorrowAmount : item.borrowAmount,
                        originFormatBorrowAmount: item.originBorrowAmount ? formatNumber(Number(item.originBorrowAmount).toFixed(2)) : formatNumber(Number(item.borrowAmount).toFixed(2)),
                        borrowAmount: '',
                        formatBorrowAmount: '',
                        remark: item.remark
                    }
                })
                this.setData({
                    submitData: {
                        ...this.data.submitData,
                        billDetailListObj
                    }
                })
                console.log(billDetailListObj)
            }
        }else{
            this.clearCurrencyData(data)
        }
    },
    // 预算
    getBudgetDetail() {
        if(!this.data.submitData.subjectId) {
            wx.showModal({
                content: '请选择科目',
                confirmText: '好的',
                showCancel: false
            })
            return
        }
        if(this.data.submitData.billApEntityListObj.length !== this.data.subjectAuxptyList.length) {
            wx.showModal({
                content: '请补全辅助核算',
                confirmText: '好的',
                showCancel: false
            })
            return
        }
        // 预算请求
        const params = {
            billTypeId: 4,
            businessDateTime: this.data.submitData.businessDateTime,
            accountbookId: this.data.submitData.accountbookId,
            submitterDepartmentId: this.data.submitData.submitterDepartmentId,
            subjectId: this.data.submitData.subjectId,
            subjectName: this.data.submitData.subjectName
        }
        this.formatBudgetData(this.data.submitData.billApEntityListObj, 'billApEntityList', params)
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'budgetController.do?getBudgetAmount',
            method: 'POST',
            data: params,
            success: res => {
                if(res.data.success) {
                    wx.showModal({
                        content: res.data.obj,
                        confirmText: '好的',
                        showCancel: false
                    })
                }
            }
        })
    },
    formatBudgetData(array, name, params) {
        if (!!array && array.length) {
            array.forEach((item, index) => {
                Object.keys(item).forEach(keys => {
                    if(keys != 'name')
                        params[`${name}[${index}].${keys}`] = item[keys]
                })
            })
        }
    },
})
