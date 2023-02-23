import moment from "moment";
import NP from "number-precision";
import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {getErrorMessage, submitSuccess, formatNumber, validFn, request} from "../../util/getErrorMessage";

var app = getApp()
app.globalData.loadingCount = 0
Page({
    data: {
        // 增加申请人
        realName: '',
        // 报销类型
        reimbursementType: null,
        reimbursementList: [],
        reimbursementIndex: 0,
        // =============外币相关============
        multiCurrency: false,
        currencyTypeIndex: 0,
        currencyTypeList: [],
        exchangeRateDisabled: false,
        // 外币字段区分
        amountField: {
            applicationAmount: 'applicationAmount',
            formatApplicationAmount: 'formatApplicationAmount',
            unverifyAmount: 'unverifyAmount',
            formatUnverifyAmount: 'formatUnverifyAmount',
            verificationAmount: 'verificationAmount',
            formatVerificationAmount: 'formatVerificationAmount',
            totalAmount: 'totalAmount',
            formatTotalAmount: 'formatTotalAmount'
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
        isPhoneXSeries: false,
        process: null,
        btnHidden: false,
        disabled: false,
        // 防止多次点击
        clickFlag: true,
        type: '',
        billId: '',
        borrowAmount: '',
        remark: '',
        fileList: [],
        accountbookIndex: 0,
        accountbookList: [],
        departmentIndex: 0,
        departmentList: [],
        borrowIndex: 0,
        borrowList: [],
        // 税率
        taxRageObject: {
            taxRageArr: [],
            taxRageIndex: 0,
        },
        // 发票类型
        invoiceTypeArr: [],
        incomeBankIndex: 0,
        incomeBankList: [],
        applicantIndex: 0,
        applicantTypeList: [
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
        // 每新增一个报销列表，就从这个数据结构拷贝一份
        subjectList: [],
        subjectExtraConf: null,
        extraIndex: 0,
        extraList: [],
        extraMessage: [],
        nowDate: moment().format('YYYY-MM-DD'),
        // 删除用的status
        status: 0,
        submitData: {
            billFilesObj: [],
            submitDate: moment().format('YYYY-MM-DD'),
            applicantType: 10,
            applicantId: '',
            invoice: 1,
            businessDateTime: moment().format('YYYY-MM-DD'),
            applicationAmount: 0,
            formatApplicationAmount: 0,
            originApplicationAmount: '',
            originFormatApplicationAmount: '',
            totalAmount: 0,
            formatTotalAmount: 0,
            formatVerificationAmount: 0,
            status: 20,
            userName: '',
            billCode: '',
            auxpropertyNames: '',
            remark: '',
            // 外币
            baseCurrencyName: '',
            baseCurrency: '',
            exchangeRate: '',
            currencyTypeId: ''
        },
        baoxiaoList: [],
        importList: [],
        tempImportList: [],
        showBorrowList: false,
    },
    // 把baoxiaoList的数据，重组一下，拼在submitData里提交
    formatSubmitData(array, name) {
        array.forEach((item, index) => {
            Object.keys(item).forEach(keys => {
                if (item[keys] instanceof Array && keys.indexOf('billDetail') !== -1 && keys.indexOf('extraMessage') < 0 && keys.indexOf('subjectExtraConf') < 0) {
                    item[keys].forEach((arrItem, arrIndex) => {
                        Object.keys(arrItem).forEach(arrKeys => {
                            this.setData({
                                submitData: {
                                    ...this.data.submitData,
                                    [`${name}[${index}].${keys.slice(0, -3)}[${arrIndex}].${arrKeys}`]: arrItem[arrKeys]
                                }
                            })
                        })
                    })
                } else {
                    // 如果是附加信息，转换成字符串
                    if (keys == 'extraMessage') {
                        this.setData({
                            submitData: {
                                ...this.data.submitData,
                                [`${name}[${index}].${keys}`]: JSON.stringify(item[keys]),
                            }
                        })
                    } else {
                        if (keys === 'subjectExtraConf' && typeof item[keys] === 'object') {
                            this.setData({
                                submitData: {
                                    ...this.data.submitData,
                                    [`${name}[${index}].${keys}`]: JSON.stringify(item[keys])
                                }
                            })
                        } else {
                            this.setData({
                                submitData: {
                                    ...this.data.submitData,
                                    [`${name}[${index}].${keys}`]: item[keys]
                                }
                            })
                        }
                    }
                }
            })
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
            if(item.indexOf('billDetailList') !== -1) {
                delete this.data.submitData[item]
            }
            if(this.data.submitData[item] === null) {
                delete this.data.submitData[item]
            }
        })
        // 处理一下提交格式
        this.formatSubmitData(this.data.baoxiaoList, 'billDetailList')
        // 提交的时候删除借款科目
        const tempData = clone(this.data.importList)
        tempData.forEach(item => {
            if(this.data.multiCurrency) {
                delete item.applicationAmount
                delete item.formatApplicationAmount
            }
            Object.keys(item).forEach(key => {
                if(item[key] === null) {
                    delete item[key]
                }
            })
            delete item['subject.fullSubjectName']
            delete item['billApXlsList']
            delete item['billTrueApXlsList']
            delete item['departDetail']
            delete item['subject']
            delete item['trueSubject']
        })
        this.formatSubmitData(tempData, 'borrowBillList')
        this.formatSubmitData(this.data.submitData.billFilesObj, 'billFiles')
        this.addLoading()
        var url = ''
        if (this.data.type === 'add') {
            url = app.globalData.url + 'reimbursementBillController.do?doAdd'
        } else {
            url = app.globalData.url + 'reimbursementBillController.do?doUpdate&id=' + this.data.billId
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
            }
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
    bindExchangeRateInput(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                exchangeRate: e.detail.value
            }
        })
        this.data.submitData.originTotalAmount && this.calculateExchangeRate(this.data.submitData.originTotalAmount)
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
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'baoxiaoList', 'totalAmount', 'reimbursementType'])
            // 重新获取科目以后，就要置空报销列表
            this.setData({
                baoxiaoList: [],
                applicantIndex: 0,
                submitData: {
                    ...this.data.submitData,
                    applicantType: 10,
                    taxpayerType: this.data.accountbookList[value].taxpayerType,
                    applicationAmount: '',
                    originApplicationAmount : '',
                    totalAmount: '',
                    verificationAmount: '',
                    originVerificationAmount: '',
                    originTotalAmount: '',
                },
            })
            // ============ 审批流 =========
            this.setData({
                oaModule: this.findAccountbookOaModule(this.data[listName][value].id, this.data.accountbookList)
            })
            this.showOaProcessByBillType(this.data[listName][value].id, 9)
            // ============ 审批流 =========
            this.setTotalAmount()
            this.getDepartmentList(this.data[listName][value].id)
            this.getBorrowBillList(this.data[listName][value].id, 10, null, null, true)
            // =============外币============
            this.initCurrency(this.data[listName][value].id)
            // =============外币============
        }
        // =============外币============
        if (name === 'currencyTypeId') {
            this.getExchangeRate({
                accountbookId: this.data.submitData.accountbookId,
                currencyTypeId: this.data[listName][value].id,
                businessDateTime: this.data.submitData.businessDateTime
            })
        }
        // =============外币============
        if (name === 'submitterDepartmentId') {
            // 重新获取科目以后，就要置空报销列表
            this.setData({
                baoxiaoList: [],
                applicantIndex: 0,
                submitData: {
                    ...this.data.submitData,
                    applicationAmount: '',
                    originApplicationAmount: '',
                    totalAmount: '',
                    originTotalAmount: '',
                    verificationAmount: '',
                    originVerificationAmount: '',
                    applicantType: 10
                },
            })
            this.setTotalAmount()
            this.getBorrowBillList(this.data.submitData.accountbookId, 10, null, null, true)
            this.getSubjectList(this.data.submitData.accountbookId, this.data[listName][value].id)
        }
        if (name === 'applicantType') {
            // uisCurrentUser 判断是否应该选择当前登录的用户的applicantId
            var isCurrentUser = true
            if(this.data[listName][value].id !== 10) {
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
    },
    bindblur(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                [e.currentTarget.dataset.name]: e.detail.value
            }
        })
    },
    clearCurrencyData(data) {
        // 清除外币字段
        var baoxiaoList = []
        var importList = []
        if(data && data.billDetailList && data.billDetailList.length) {
            baoxiaoList = data.billDetailList.map(item => {
                return {
                    ...item,
                    applicationAmount: item.applicationAmount,
                    formatApplicationAmount: formatNumber(Number(item.applicationAmount).toFixed(2)),
                    originApplicationAmount: '',
                    originFormatApplicationAmount: '',
                }
            })
        }
        if(data && data.borrowBillList && data.borrowBillList.length) {
            importList = data.borrowBillList.map(item => {
                return {
                    ...item,
                    applicationAmount: item.applicationAmount,
                    formatApplicationAmount: formatNumber(Number(item.applicationAmount).toFixed(2)),
                    originApplicationAmount: '',
                    originFormatApplicationAmount: '',
                }
            })
        }
        this.setData({
            currencyTypeIndex: 0,
            currencyTypeList: [],
            exchangeRateDisabled: false,
            baoxiaoList ,
            importList,
            submitData: {
                ...this.data.submitData,
                isMultiCurrency: null,
                baseCurrency: '',
                baseCurrencyName: '',
                currencyTypeId: '',
                applicationAmount: '',
                formatApplicationAmount: '',
                verificationAmount: '',
                formatVerificationAmount: '',
                originVerificationAmount: '',
                originFormatVerificationAmount: '',
                originApplicationAmount: '',
                originFormatApplicationAmount: ''
            }
        })
    },
    onBusinessFocus(e) {
        // wx.datePicker({
        //     format: 'yyyy-MM-dd',
        //     currentDate: moment().format('YYYY-MM-DD'),
        //     success: (res) => {
        //         this.setData({
        //             submitData: {
        //                 ...this.data.submitData,
        //                 businessDateTime: res.date
        //             }
        //         })
        //         // 解除focus不触发的解决办法。
        //         // this.onClick()
        //     },
        // })
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
    },
    getBorrowIdFromStorage() {
        // 从缓存里获取借款人id
        const borrowId = wx.getStorageSync('borrowId')
        if (!!borrowId) {
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
            this.getIncomeBankList(this.data.submitData.applicantType, borrowId)
        }
    },
    getSelectedBorrowListFromStorage() {
        wx.getStorage({
            key: 'importList',
            success: res => {
                const importList = res.data
                if (!!importList && importList.length) {
                    // 外币
                    if (this.data.multiCurrency) {
                        importList.forEach(item => {
                            item.originApplicationAmount = item.applicationAmount
                            item.originFormatApplicationAmount = item.formatApplicationAmount
                            item.applicationAmount = ''
                            item.formatApplicationAmount = ''
                        })
                    }
                    const newImportList = this.caculateImportList(importList)
                    this.setData({
                        importList: newImportList
                    })
                    this.setBorrowAmount(newImportList)
                    this.setTotalAmount()
                }
            }
        })
        wx.removeStorage({
            key: 'importList',
            success: res => {
            }
        })
    },
    caculateImportList(importList, inputValue, index) {
        let totalApplicationAmount = Number(this.data.submitData[this.data.amountField.applicationAmount].toFixed(2))
        const newImportList = importList.map(item => {
            let applicationAmount = NP.minus(totalApplicationAmount, Number(item[this.data.amountField.applicationAmount]))
            if(applicationAmount <= 0 && totalApplicationAmount > 0) {
                applicationAmount = totalApplicationAmount
                totalApplicationAmount = 0
            }else if(applicationAmount <= 0 && totalApplicationAmount <= 0){
                applicationAmount = 0
                totalApplicationAmount = 0
            }else{
                applicationAmount = item[this.data.amountField.applicationAmount]
                totalApplicationAmount = NP.minus(totalApplicationAmount, Number(item[this.data.amountField.applicationAmount]))
            }
            return {
                ...item,
                [this.data.amountField.formatUnverifyAmount]: formatNumber(item[this.data.amountField.unverifyAmount]),
                [this.data.amountField.applicationAmount]: applicationAmount
            }
        })
        return newImportList
    },
    getBaoxiaoDetailFromStorage() {
        const index = wx.getStorageSync('index')
        this.setData({
            submitData: {
                ...this.data.submitData,
            }
        })
        wx.getStorage({
            key: 'newBaoxiaoDetailArr',
            success: res => {
                const baoxiaoDetail = res.data
                //=============== 外币 =================
                if (this.data.multiCurrency) {
                    baoxiaoDetail.forEach(item => {
                        item.originApplicationAmount = item.applicationAmount
                        item.applicationAmount = ''
                        item.originFormatApplicationAmount = formatNumber(Number(item.originApplicationAmount).toFixed(2))
                        item.formatApplicationAmount = ''
                    })
                }
                //=============== 外币 =================
                if (!!baoxiaoDetail) {
                    // 处理wxml模板表达式不识别
                    baoxiaoDetail.forEach(item => {
                        item.subjectName = item.subjectName.split('_').pop()
                    })
                    let baoxiaoList = clone(this.data.baoxiaoList)
                    if (!!index || index === 0) {
                        baoxiaoList.splice(index, 1)
                        wx.removeStorage({
                            key: 'index',
                            success: res => {
                            }
                        })
                        baoxiaoList.splice(index, 0, baoxiaoDetail[0])
                        baoxiaoList = baoxiaoList.concat(baoxiaoDetail.slice(1))
                        this.setData({
                            baoxiaoList: baoxiaoList
                        })
                    } else {
                        this.setData({
                            baoxiaoList: baoxiaoList.concat(baoxiaoDetail)
                        })
                    }
                    this.setData({
                        showBorrowList: true
                    })
                    this.setApplicationAmount(baoxiaoList)
                    this.setTotalAmount()
                }
            }
        })
        wx.removeStorage({
            key: 'newBaoxiaoDetailArr',
            success: res => {
            }
        })
    },
    onShow() {
        // 从缓存获取用户已经选择的审批人
        this.getSelectedUserListFromStorage()
        // 从缓存里获取借款列表
        this.getSelectedBorrowListFromStorage()
        // 从缓存里获取借款人id
        this.getBorrowIdFromStorage()
        // 从缓存里获取baoxiaoDetail
        this.getBaoxiaoDetailFromStorage()
    },
    // 删除得时候把submitData里面之前存的报销列表数据清空
    clearListSubmitData(submitData) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf('billDetailList') !== -1) {
                delete submitData[key]
            }
        })
    },
    deleteBaoxiaoDetail(e) {
        var idx = e.currentTarget.dataset.index
        var baoxiaoList = this.data.baoxiaoList.filter((item, index) => {
            return idx !== index
        })
        this.clearListSubmitData(this.data.submitData)
        this.setData({
            baoxiaoList
        })
        if(!baoxiaoList.length) {
            this.setData({
                showBorrowList: false,
                importList: []
            })
        }
        this.setApplicationAmount(baoxiaoList)
        this.setTotalAmount()
    },
    // 删除得时候把submitData里面之前存的报销列表数据清空
    clearFileList(submitData) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf('billFiles') !== -1) {
                delete submitData[key]
            }
        })
    },

    deleteFile(e) {
        var file = e.currentTarget.dataset.file
        var fileList = this.data.submitData.billFilesObj.filter(item => {
            return item.name !== file
        })
        this.clearFileList(this.data.submitData)
        this.setData({
            submitData: {
                ...this.data.submitData,
                billFilesObj: fileList
            }
        })
    },
    previewFile(e) {
        var url = e.currentTarget.dataset.url
        wx.previewImage({
            urls: [url],
        })
    },
    handleUpload() {
        wx.chooseImage({
            count: 9,
            success: res => {
                this.uploadFile(res.tempFilePaths)
            },
            fail: res => {
            }
        })
    },
    /**
     *
     * @param 上传图片字符串列表
     */
    uploadFile(array) {
        if (array.length) {
            this.addLoading()
            let promiseList = []
            array.forEach(item => {
                promiseList.push(new Promise((resolve, reject) => {
                    wx.uploadFile({
                        url: app.globalData.url + 'aliyunController/uploadImages.do',
                        name: item,
                        filePath: item,
                        formData: {
                            accountbookId: this.data.submitData.accountbookId,
                            submitterDepartmentId: this.data.submitData.submitterDepartmentId
                        },
                        success: res => {
                            const result = JSON.parse(res.data)
                            if (result.obj && result.obj.length) {
                                const file = result.obj[0]
                                resolve(file)
                            } else {
                                reject('上传失败')
                            }
                        },
                        fail: res => {
                            reject(res)
                        }
                    })
                }))
            })
            Promise.all(promiseList).then(res => {
                // 提交成功的处理逻辑
                this.hideLoading()
                var billFilesList = []
                res.forEach(item => {
                    const obj = {
                        name: item.name,
                        size: item.size,
                        uri: item.uri
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
                this.hideLoading()
                wx.showModal({
                    content: '上传失败',
                    confirmText: '好的',
                    showCancel: false,
                    success: res => {

                    }
                })
            })
        }
    },
    downloadFile(e) {
        var url = e.currentTarget.dataset.url
        wx.downloadFile({
            url,
            success({filePath}) {
                wx.previewImage({
                    urls: [filePath]
                })
            }
        })
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
    onLoad(query) {
        // 增加申请人
        this.setData({
            realName: app.globalData.realName
        })
        app.globalData.loadingCount = 0
        this.getTaxRageArr()
        this.getInvoiceTypeArr()
        // =========报销类型============
        this.getReimbursementList()
        // =========报销类型============
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
            //渲染
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
        fields.forEach(field => {
            if(this.data[field] && this.data[field].length) {
                result = true
            }else{
                if(this.data.submitData[field]) {
                    result = true
                }else{
                    result = false
                }
            }
        })
        if(this.data.oaModule && this.data.showOaUserNodeList && result) {
            this.setData({
                showOa: true
            })
            this.getProcess(fields, 9)
        }else{
            this.setData({
                showOa: false
            })
        }
    },
    getOaParams(fields, billType) {
        let params = ''
        fields.forEach(item => {
            if(this.data.submitData[item] || this.data.submitData[item] === 0) {
                params += '&' + item + '=' + this.data.submitData[item]
            }else{
                const applicationAmount = this.data.submitData.applicationAmount ? this.data.submitData.applicationAmount : 0
                params += '&applicationAmount=' + applicationAmount
            }
        })
        params = '&billType=' + billType + params
        return params
    },
    getProcess(fields) {
        const params = this.getOaParams(fields, 9)
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
    // 获取税率
    getTaxRageArr() {
        request({
            url: app.globalData.url + 'systemController.do?formTree&typegroupCode=VATRateForMost',
            method: 'GET',
            success: res => {
                res.data[0].children.unshift({
                    id: null,
                    text: '请选择'
                })
                this.setData({
                    taxRageObject: {
                        taxRageArr: res.data[0].children,
                        taxRageIndex: 0
                    }
                })
            }
        })
    },
    getInvoiceTypeArr() {
        request({
            url: app.globalData.url + 'systemController.do?formTree&typegroupCode=invoiceType',
            method: 'GET',
            success: res => {
                this.setData({
                    invoiceTypeArr: res.data[0].children
                })
            }
        })
    },
    // 获取申请组织
    getAccountbookList(data) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'accountbookController.do?getAccountbooksJsonByUserId&corpId=' + app.globalData.corpId,
            method: 'GET',
            success: res => {
                (async () => {
                    if(res.data.success && res.data.obj.length) {
                        var accountbookIndex = 0
                        var taxpayerType = !!data ? data.accountbook.taxpayerType : null
                        var accountbookId = !!data ? data.accountbookId : res.data.obj[0].id
                        // ============ 审批流 =========
                        this.setData({
                            oaModule: this.findAccountbookOaModule(accountbookId, res.data.obj)
                        })
                        this.showOaProcessByBillType(accountbookId, 9)
                        // ============ 审批流 =========
                        // ============ 外币 =========
                        const currencyTypeId = !!data && data.currencyTypeId ? data.currencyTypeId : undefined
                        const exchangeRate = !!data && data.exchangeRate ? data.exchangeRate : undefined
                        await this.initCurrency(accountbookId, currencyTypeId, exchangeRate, data)
                        // ============ 外币 =========
                        // edit的时候设置值
                        if (accountbookId) {
                            res.data.obj.forEach((item, index) => {
                                if (item.id === accountbookId) {
                                    accountbookIndex = index
                                    taxpayerType = item.taxpayerType
                                }
                            })
                        }
                        this.setData({
                            accountbookList: res.data.obj,
                            accountbookIndex: accountbookIndex,
                            submitData: {
                                ...this.data.submitData,
                                accountbookId,
                                taxpayerType
                            }
                        })
                        var submitterDepartmentId = data ? data.submitterDepartmentId : ''
                        var applicantType = data ? data.applicantType : 10
                        var applicantId = data ? data.applicantId : ''
                        var applicantIndex = 0
                        this.data.applicantTypeList.forEach((item, index) => {
                            if(item.id === applicantType) {
                                applicantIndex = index
                            }
                        })
                        this.setData({
                            applicantIndex
                        })
                        var incomeBankName = data ? data.incomeBankName : ''
                        var billDetailList = data ? data.billDetailList : []
                        this.getBorrowBillList(accountbookId, applicantType, applicantId, incomeBankName, true)
                        this.getDepartmentList(accountbookId, submitterDepartmentId, billDetailList, taxpayerType)
                    }else{
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
                })()
            }
        })
    },
    // 获取申请部门
    getDepartmentList(accountbookId, departmentId, billDetailList, taxpayerType) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'newDepartController.do?departsJson&accountbookId=' + accountbookId,
            method: 'GET',
            dataType: 'json',
            success: res => {
                if(res.data && res.data.length) {
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
                        },
                    })
                    this.getSubjectList(accountbookId, submitterDepartmentId, billDetailList, taxpayerType)
                }else{
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
            }
        })
    },
    // 获取借款单位
    getBorrowBillList(accountbookId, applicantType, applicant, incomeBankName, isCurrentUser) {
        this.addLoading()
        request({
            hideLoading:this.hideLoading,
            url: app.globalData.url + 'borrowBillController.do?borrowerObjectList&accountbookId=' + accountbookId + '&applicantType=' + applicantType + '&billType=9',
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
                if(isCurrentUser) {
                    applicantId = !!applicant ? applicant : app.globalData.applicantId
                }else{
                    applicantId = arr[0].id
                }
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
            }
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
                console.log(res, 'incomeBankList')
                var arr = res.data.obj
                if (arr.length) {

                }
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
            }
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
    // 组成初始详情数据
    generateBaseDetail() {
        if (this.data.subjectList.length) {
            var subjectList = clone(this.data.subjectList)
            var newTaxRageObj = clone(this.data.taxRageObject)
            var taxpayerType = this.data.submitData.taxpayerType
            var obj = {
                subjectList: subjectList,
                selectedAuxpty: null,
                allAuxptyList: {},
                accountbookId: this.data.submitData.accountbookId,
                taxpayerType: this.data.submitData.taxpayerType,
                submitterDepartmentId: this.data.submitData.submitterDepartmentId,
                businessDateTime: this.data.submitData.businessDateTime,
                applicantId: this.data.submitData.applicantId,
                applicantType: this.data.submitData.applicantType,
                applicationAmount: '',
                originApplicationAmount: '',
                invoiceTypeArr: this.data.invoiceTypeArr,
                invoiceType: taxpayerType == 1 ? this.data.invoiceTypeArr[0].id : this.data.invoiceTypeArr[1].id,
                taxRageObject: clone(newTaxRageObj),
                taxRageArr: clone(newTaxRageObj).taxRageArr,
                taxRageIndex: clone(newTaxRageObj).taxRageIndex,
                taxRate: taxpayerType == 2 ? clone(newTaxRageObj).taxRageArr[0].id : '',
                remark: '',
            }
        }
        return obj
    },
    onAddBaoxiao() {
        var obj = this.generateBaseDetail()
        console.log(obj, 'obj')
        if(!!obj) {
            wx.setStorage({
                key: 'initBaoxiaoDetail',
                data: obj,
                success: res => {
                    console.log('写入报销详情成功...')
                    wx.navigateTo({
                        url: '/pages/baoxiaoDetail/index'
                    })
                }
            })
        }else{
            wx.showModal({
                content: '当前部门没有可用的费用类型',
                confirmText: '好的',
                showCancel: false,
                success: () => {
                    //
                },
            });
        }
    },
    // 请求编辑回显数据
    getEditData(id) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'reimbursementBillController.do?getDetail&id=' + id,
            method: 'GET',
            dataType: 'json',
            success: res => {
                console.log(res, '获取报销单编辑回显')
                if (res.data.obj) {
                    this.setRenderData(res.data.obj)
                    this.getProcessInstance(id, res.data.obj.accountbookId)
                }
            }
        })
    },
    // 回显数据设置
    setRenderData(data) {
        // 请求
        this.getAccountbookList(data)
        var importList = data.borrowBillList.map(item => {
            // 外币
            if (data.currencyTypeId) {
                return {
                    "subject.fullSubjectName": item.subject.fullSubjectName,
                    billDetailId: item.billDetailId,
                    remark: item.remark,
                    applicationAmount: '',
                    formatApplicationAmount: '',
                    // 外币
                    originApplicationAmount: item.originApplicationAmount,
                    originFormatApplicationAmount: formatNumber(Number(item.originApplicationAmount))
                }
            }
            return {
                "subject.fullSubjectName": item.subject.fullSubjectName,
                billDetailId: item.billDetailId,
                remark: item.remark,
                applicationAmount: item.applicationAmount,
                formatApplicationAmount: formatNumber(Number(item.applicationAmount)),
                originApplicationAmount: '',
                originFormatApplicationAmount: '',
            }
        })
        //fileList
        if (data.billFiles.length) {
            var billFilesObj = data.billFiles.map(item => {
                delete item.createDate
                delete item.updateDate
                return item
            })
        }

        // 报销类型
        this.getReimbursementList(data.reimbursementType)

        // 设置数据
        this.setData({
            ...this.data,
            // baoxiaoList,
            importList: clone(importList),
            status: data.status,
            submitData: {
                ...this.data.submitData,
                billFilesObj: billFilesObj || [],
                submitDate: moment().format('YYYY-MM-DD'),
                applicantType: data.applicantType,
                invoice: data.invoice,
                businessDateTime: data.businessDateTime.split(' ')[0],
                applicationAmount: data.applicationAmount,
                formatApplicationAmount: formatNumber(Number(data.applicationAmount).toFixed(2)),
                verificationAmount: data.verificationAmount,
                formatVerificationAmount: formatNumber(Number(data.verificationAmount).toFixed(2)),
                totalAmount: data.totalAmount,
                formatTotalAmount: formatNumber(Number(data.totalAmount).toFixed(2)),
                // 外币
                originApplicationAmount: data.originApplicationAmount,
                originFormatApplicationAmount: formatNumber(Number(data.originApplicationAmount).toFixed(2)),
                originVerificationAmount: data.originVerificationAmount,
                originFormatVerificationAmount: formatNumber(Number(data.originVerificationAmount).toFixed(2)),
                originTotalAmount: data.originTotalAmount,
                originFormatTotalAmount:formatNumber(Number(data.originTotalAmount).toFixed(2)),
                exchangeRate: data.exchangeRate,
                // 报销类型
                reimbursementType: data.reimbursementType || '',
                status: data.status,
                remark: data.remark,
                userName: app.globalData.realName,
                accountbookId: data.accountbookId,
                billCode: data.billCode,
            },
        })
        let t = null
        t = setTimeout(() => {
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'baoxiaoList', 'totalAmount', 'reimbursementType'])
            this.setRenderProgress(JSON.parse(data.oaBillUserNodeListJson))
            clearTimeout(t)
            t = null
        })
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
                url = "userController.do?datagrid&field=id,realName&accountbookIds=" + accountbookId + "&id=" + this.data.submitData.applicantId
                break
            case "3":
                // 供应商
                url = "supplierDetailController.do?datagrid&field=id,supplier.supplierName&status=1&accountbookId=" + accountbookId + "&id=" + this.data.submitData.applicantId
                break
            case "4":
                // 客户
                url = "customerDetailController.do?datagrid&field=id,customer.customerName&customerStatus=1&accountbookId=" + accountbookId + "&id=" + this.data.submitData.applicantId
                break
            default:
                url = "auxpropertyDetailController.do?datagridByAuxpropertyPop&field=id,auxptyDetailName&auxptyId=" + auxptyid + "&accountbookId=" + accountbookId
        }
        return url
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
    // 获取科目类型
    getSubjectList(accountbookId, departId, billDetailList, taxpayerType) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'subjectController.do?combotree&accountbookId=' + accountbookId + '&departId=' + departId + '&billTypeId=9&findAll=false',
            method: 'GET',
            success: res => {
                console.log(res, '科目类型')
                var arr = []
                if (res.data.length) {
                    res.data.forEach(item => {
                        if (!item.childrenCount) {
                            arr.push({
                                id: item.id,
                                name: item.text,
                                subjectExtraId: item.subjectExtraId
                            })
                        }
                    })
                    // 写入缓存
                    wx.setStorage({
                        key: 'subjectList',
                        data: arr,
                        success: res => {
                            console.log(arr, '..............................')
                            console.log('写入科目成功')
                        }
                    })
                    this.setData({
                        subjectList: arr
                    })
                    // billDetailList
                    if (billDetailList && billDetailList.length) {
                        var baoxiaoList = billDetailList.map(item => {
                            var obj = {}
                            var subjectExtraId = ''
                            var subjectId = item.subjectId
                            arr.forEach((arrItem, arrIndex) => {
                                if (arrItem.id === subjectId) {
                                    // 附加信息科目ID
                                    subjectExtraId = arrItem.subjectExtraId
                                }
                            })
                            obj.accountbookId = accountbookId
                            obj.taxpayerType = taxpayerType
                            obj.subjectId = item.subjectId
                            obj.subjectName = item.subject.fullSubjectName,
                            obj.subjectExtraId = subjectExtraId
                            obj.trueSubjectId = item.trueSubjectId
                            obj.trueSubjectName = item.subject.trueSubjectName
                            // 外币
                            if (this.data.multiCurrency) {
                                obj.originApplicationAmount = item.originApplicationAmount
                                obj.originFormatApplicationAmount = formatNumber(Number(item.originApplicationAmount).toFixed(2))
                                obj.applicationAmount = ''
                                obj.formatApplicationAmount = ''
                            } else {
                                obj.applicationAmount = item.applicationAmount
                                obj.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2))
                            }
                            // 发票
                            if(item.invoiceInfoId && item.invoiceInfoId !== 'null') {
                                obj.invoiceInfoId = item.invoiceInfoId
                            }
                            // 附加信息
                            if (!!item.extraMessage) {
                                obj.extraMessage = JSON.parse(item.extraMessage)
                                obj.subjectExtraConf = JSON.parse(item.subjectExtraConf)
                                var extraList = []
                                if (obj.extraMessage && obj.extraMessage.length > 0) {
                                    obj.extraMessage.forEach(item => {
                                        extraList.push({conf: this.generateExtraList(obj.subjectExtraConf).array})
                                    })
                                    obj.extraList = extraList
                                }
                            }
                            // 用户之前有的辅助核算项
                            const auxptyObj = item.billDetailApEntityList.map(auxptyItem => {
                                return {
                                    auxptyId: auxptyItem.auxptyId,
                                    auxptyDetailId: auxptyItem.auxptyDetailId,
                                    auxptyDetailName: auxptyItem.auxptyDetailName
                                }
                            })
                            const billDetailApEntityObj = {}
                            auxptyObj.forEach(item => {
                                billDetailApEntityObj[item.auxptyId] = {
                                    auxptyId: item.auxptyId,
                                    id: item.auxptyDetailId,
                                    name: item.auxptyDetailName
                                }
                            })
                            obj.selectedAuxpty = billDetailApEntityObj
                            obj.billDetailApEntityListObj = auxptyObj
                            obj.allAuxptyList = {}
                            if (item.subject.subjectAuxptyList && item.subject.subjectAuxptyList.length) {
                                obj.subjectAuxptyList = item.subject.subjectAuxptyList.map(item => {
                                    return {
                                        auxptyId: item.auxptyId,
                                        auxptyName: item.auxpropertyConfig.auxptyName
                                    }
                                })
                            }
                            obj.remark = item.remark
                            obj.taxRageObject = this.data.taxRageObject
                            if (item.invoiceType == 2) {
                                obj.taxRageArr = this.data.taxRageObject.taxRageArr
                                obj.taxRate = item.taxRate
                                this.data.taxRageObject.taxRageArr.forEach((taxItem, index) => {
                                    if (taxItem.id == item.taxRate) {
                                        obj.taxRageIndex = index
                                    }
                                })
                            } else {
                                obj.taxRageArr = []
                                obj.taxRate = ''
                                obj.taxRageIndex = 0
                            }
                            obj.id = item.id
                            obj.invoiceType = item.invoiceType
                            obj.invoiceTypeArr = this.data.invoiceTypeArr

                            return obj
                        })
                        this.setData({
                            baoxiaoList,
                            showBorrowList: true
                        })
                        // 外币重新算一下originTotalAmount
                        this.setTotalAmount()
                    }
                } else {
                    // 写入缓存
                    wx.setStorage({
                        key: 'subjectList',
                        data: [],
                        success: res => {
                            console.log(arr, '..............................')
                            console.log('写入科目成功')
                        }
                    })
                    this.setData({
                        subjectList: [],
                    })
                }
            }
        })
    },
    getImportBorrowList() {
        const invoice = this.data.submitData.invoice == 0 ? 1 : 0
        if(this.data.clickFlag) {
            this.setData({
                clickFlag: false
            })
            let url = app.globalData.url + 'borrowBillController.do?dataGridManager&accountbookId=' + this.data.submitData.accountbookId + '&applicantType=' + this.data.submitData.applicantType + '&applicantId=' + this.data.submitData.applicantId + '&invoice=' + invoice + '&query=import&field=id,billCode,accountbookId,departDetail.id,departDetail.depart.departName,subjectId,subject.fullSubjectName,auxpropertyNames,submitter.id,submitter.realName,invoice,contractNumber,amount,unverifyAmount,remark,businessDateTime,submitDate,'
            if(this.data.multiCurrency) {
                url = app.globalData.url + 'borrowBillController.do?dataGridManager&accountbookId=' + this.data.submitData.accountbookId + '&applicantType=' + this.data.submitData.applicantType + '&applicantId=' + this.data.submitData.applicantId + '&currencyTypeId=' + this.data.submitData.currencyTypeId + '&invoice=' + invoice + '&query=import&field=id,billCode,accountbookId,departDetail.id,departDetail.depart.departName,applicantId,applicantName,subjectId,subject.fullSubjectName,auxpropertyNames,submitter.id,submitter.realName,invoice,contractNumber,currencyTypeId,amount,originAmount,unverifyAmount,originUnverifyAmount,remark,businessDateTime,submitDate'
            }
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url,
                method: 'GET',
                success: res => {
                    console.log(res, '借款单列表...')
                    if(res.data.rows.length) {
                        // 外币
                        if(this.data.multiCurrency) {
                            wx.setStorageSync('multiCurrency', this.data.multiCurrency)
                        }else{
                            wx.removeStorageSync('multiCurrency')
                        }
                        wx.setStorage({
                            key: 'tempImportList',
                            data: res.data.rows,
                            success: res => {
                                console.log('写入成功，借款列表')
                                wx.navigateTo({
                                    url: '/pages/importBorrowList/index'
                                })
                            }
                        });
                    }else{
                        wx.setStorage({
                            key: 'tempImportList',
                            data: [],
                            success: () =>{}
                        })
                        wx.showModal({
                            content: '没有需要核销的借款',
                            confirmText: '好的',
                            showCancel: false,
                            success: () => {
                                //
                            },
                        });
                    }
                },
                complete: res => {
                    const t = setTimeout(() => {
                        this.setData({
                            clickFlag: true
                        })
                        clearTimeout(t)
                    }, 300)
                }
            })
        }
    },
    borrowBlur(e) {
        console.log(this.data.importList, 'borrowBlur........')
    },
    borrowInput(e) {
        var value = e.detail.value
        var index = e.currentTarget.dataset.index
        var tempData = clone(this.data.importList)
        // 本次核销金额
        tempData[index][this.data.amountField.applicationAmount] = value
        tempData[index][this.data.amountField.formatApplicationAmount] = formatNumber(Number(value).toFixed(2))
        const newImportList = this.caculateImportList(tempData, value, index)
        // 验证输入
        if(Number(value) - Number(newImportList[index][this.data.amountField.applicationAmount]) > 0) {
            validFn('输入金额不能大于申请核销金额')
            return
        }

        if(Number(value) - Number(newImportList[index].unverifyAmount) > 0) {
            validFn('输入金额不能大于未核销金额')
            return
        }

        this.setData({
            importList: newImportList,
        })
        this.setBorrowAmount(newImportList)
        this.setTotalAmount()
    },
    setBorrowAmount(array) {
        var borrowTotalAmount = 0
        if (array.length) {
            array.forEach(item => {
                borrowTotalAmount += Number(item[this.data.amountField.applicationAmount])
            })
        }
        // 外币
        if (this.data.multiCurrency) {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    originVerificationAmount: borrowTotalAmount,
                    originFormatVerificationAmount: formatNumber(Number(borrowTotalAmount).toFixed(2))
                }
            })
        } else {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    verificationAmount: borrowTotalAmount,
                    formatVerificationAmount: formatNumber(Number(borrowTotalAmount).toFixed(2))
                }
            })
        }
        return borrowTotalAmount
    },
    setApplicationAmount(array) {
        var applicationAmount = 0
        if (array.length) {
            array.forEach(item => {
                applicationAmount += Number(item[this.data.amountField.applicationAmount])
            })
        }
        this.setData({
            submitData: {
                ...this.data.submitData,
                [this.data.amountField.applicationAmount]: applicationAmount,
                [this.data.amountField.formatApplicationAmount]: formatNumber(Number(applicationAmount).toFixed(2))
            }
        })
        return applicationAmount
    },
    setTotalAmount() {
        // 申请报销金额
        var applicationAmount = this.setApplicationAmount(this.data.baoxiaoList) || 0
        // 核销金额
        var verificationAmount = this.setBorrowAmount(this.data.importList) || 0
        // 应付款金额
        var totalAmount = Number(applicationAmount) - Number(verificationAmount)
        // 记录一下计算之前的总数
        var oldTotalAmount = this.data.submitData[this.data.amountField.totalAmount]
        if (this.data.multiCurrency) {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    originTotalAmount: totalAmount,
                    originFormatTotalAmount: formatNumber(Number(totalAmount).toFixed(2)),
                }
            })
            this.calculateExchangeRate(totalAmount)
        } else {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    totalAmount: totalAmount,
                    formatTotalAmount: formatNumber(Number(totalAmount).toFixed(2)),
                }
            })
        }
        if(totalAmount != oldTotalAmount) {
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'baoxiaoList', 'totalAmount', 'reimbursementType'])
        }
    },
    clearBorrowList(submitData) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf('borrowBillList') !== -1) {
                delete submitData[key]
            }
        })
    },
    deleteBorrowDetail(e) {
        var id = e.currentTarget.dataset.id
        var tempArr = this.data.importList.filter(item => item.billDetailId !== id)
        this.clearBorrowList(this.data.submitData)
        this.setData({
            importList: tempArr
        })
        this.setBorrowAmount(tempArr)
        this.setTotalAmount()
    },
    generateExtraList(conf) {
        var tempData = clone(conf)
        var array = []
        var extraMessage = []
        tempData.name.forEach((item, index) => {
            var obj = {}
            obj.field = item
            obj.type = tempData.type[index]
            obj.collectStatus = tempData.collectStatus[index] || '0'
            array.push(obj)
            if (obj.type == 2) {
                extraMessage.push(moment().format('YYYY-MM-DD'))
            } else {
                extraMessage.push('')
            }
        })
        return {
            array,
            extraMessage
        }
    },
    showBaoxiaoDetail(e) {
        // 加一个编辑标志
        wx.setStorage({
            key: 'edit',
            data: true,
            success: res => {
                console.log('编辑标志缓存成功...')
            }
        })
        this.addLoading()
        const index = e.currentTarget.dataset.index
        this.data.baoxiaoList[index].applicantType = this.data.submitData.applicantType
        this.data.baoxiaoList[index].applicantId = this.data.submitData.applicantId
        this.data.baoxiaoList[index].taxpayerType = this.data.submitData.taxpayerType
        // 外币
        if (this.data.multiCurrency) {
            this.data.baoxiaoList[index].applicationAmount = this.data.baoxiaoList[index].originApplicationAmount
        }
        var obj = this.generateBaseDetail()
        wx.setStorage({
            key: 'index',
            data: index,
            success: res => {
                console.log('index设置成功...')
            }
        })
        wx.setStorage({
            key: 'baoxiaoDetail',
            data: this.data.baoxiaoList[index],
            success: res => {
                console.log(this.data.baoxiaoList[index])
                console.log('写入报销详情成功！！')
                wx.setStorage({
                    key: 'initBaoxiaoDetail',
                    data: obj,
                    success: res => {
                        this.hideLoading()
                        wx.navigateTo({
                            url: '/pages/baoxiaoDetail/index'
                        })
                    }
                })
            }
        })
    },
    goInfoList() {
        wx.navigateTo({
            url: '/pages/infoList/index'
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
                flag: 'B'
            }
        })
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该单据吗?',
            confirmText: '是',
            cancelText: '否',
            cancelColor: '#ff5252',
            success: res => {
                if(res.confirm) {
                    this.addLoading()
                    request({
                        hideLoading: this.hideLoading,
                        url: app.globalData.url + 'reimbursementBillController.do?doBatchDel&ids=' + this.data.billId,
                        method: 'GET',
                        success: res => {
                            console.log(res)
                            if(res.data.success) {
                                wx.navigateBack({
                                    delta: 1
                                })
                            }else{
                                wx.showModal({
                                    content: '报销单删除失败',
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
            url: app.globalData.url + 'weixinController.do?getProcessinstanceJson&billType=9&billId=' + billId + '&accountbookId=' + accountbookId,
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
    // ====================外币=====================
    calculateExchangeRate(origin) {
        var exchangeRate = this.data.submitData.exchangeRate
        var value = NP.divide(origin, exchangeRate)
        this.setData({
            submitData: {
                ...this.data.submitData,
                applicationAmount: value,
                totalAmount: value,
                formatTotalAmount: formatNumber(Number(value).toFixed(2))
            }
        })
    },
    getCurrencyTagByAccountbookId(accountbookId) {
        return new Promise((resolve, reject) => {
            request({
                hideLoading: this.hideLoading,
                url: `${app.globalData.url}accountbookController.do?isMultiCurrency&accountbookId=${accountbookId}`,
                method: 'GET',
                success: res => {
                    if (res.statusCode == 200) {
                        resolve(res.data.multiCurrency)
                    } else {
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
                    if (res.statusCode == 200) {
                        resolve(res.data)
                    } else {
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
                    if (res.statusCode == 200) {
                        resolve(res.data)
                    } else {
                        resolve([])
                    }
                },
            })
        })
    },
    getExchangeRate({accountbookId, businessDateTime, currencyTypeId}) {
        if (currencyTypeId === this.data.submitData.baseCurrency) {
            this.setData({
                exchangeRateDisabled: true,
                submitData: {
                    ...this.data.submitData,
                    exchangeRate: 1
                }
            })
            this.data.submitData.originTotalAmount && this.calculateExchangeRate(this.data.submitData.originTotalAmount)
            return
        }
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}exchangeRateController.do?getAverageExchangeRate&accountbookId=${accountbookId}&businessDateTime=${businessDateTime}&currencyTypeId=${currencyTypeId}`,
            method: 'GET',
            success: res => {
                if (res.statusCode == 200) {
                    this.setData({
                        exchangeRateDisabled: false,
                        submitData: {
                            ...this.data.submitData,
                            exchangeRate: res.data.obj || 0
                        }
                    })
                    this.data.submitData.originTotalAmount && this.calculateExchangeRate(this.data.submitData.originTotalAmount)
                }
            },
        })
    },
    async initCurrency(accountbookId, currencyTypeId, exchangeRate, data) {
        const multiCurrency = await this.getCurrencyTagByAccountbookId(accountbookId)
        this.setData({
            multiCurrency: multiCurrency,
            amountField: {
                applicationAmount: multiCurrency ? 'originApplicationAmount' : 'applicationAmount',
                formatApplicationAmount: multiCurrency ? 'originFormatApplicationAmount' : 'formatApplicationAmount',
                verificationAmount: multiCurrency ? 'originVerificationAmount' : 'verificationAmount',
                formatVerificationAmount: multiCurrency ? 'originFormatVerificationAmount' : 'formatVerificationAmount',
                unverifyAmount: multiCurrency ? 'originUnverifyAmount' : 'unverifyAmount',
                formatUnverifyAmount: multiCurrency ? 'originFormatUnverifyAmount' : 'formatUnverifyAmount',
                totalAmount: multiCurrency ? 'originTotalAmount' : 'totalAmount',
                formatTotalAmount: multiCurrency ? 'originFormatTotalAmount' : 'formatTotalAmount',
            }
        })
        if (multiCurrency) {
            const currencyTypeList = await this.getCurrencyTypeListByAccountbookId(accountbookId)
            let currencyType = currencyTypeList[0].id
            let currencyTypeIndex = 0
            if (currencyTypeId) {
                currencyTypeList.forEach((item, index) => {
                    if (item.id == currencyTypeId) {
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
            if (!exchangeRate) {
                this.getExchangeRate({
                    accountbookId,
                    currencyTypeId: currencyType,
                    businessDateTime: this.data.submitData.businessDateTime,
                })
            } else {
                if (currencyType === this.data.submitData.baseCurrency) {
                    this.setData({
                        exchangeRateDisabled: true,
                        submitData: {
                            ...this.data.submitData,
                            exchangeRate: 1
                        }
                    })
                    return
                }
                this.setData({
                    submitData: {
                        ...this.data.submitData,
                        exchangeRate
                    }
                })
            }
            // billDetailList
            // 外币
            var billDetailList = []
            var borrowBillList = []
            if (data && data.billDetailList && data.billDetailList.length) {
                billDetailList = data.billDetailList.map(item => {
                    return {
                        ...item,
                        originApplicationAmount: item.originApplicationAmount ? item.originApplicationAmonut : item.applicationAmount,
                        originFormatApplicationAmount: item.originApplicationAmount ? formatNumber(Number(item.originApplicationAmount).toFixed(2)) : formatNumber(Number(item.applicationAmount).toFixed(2))
                    }
                })
                this.setData({
                    baoxiaoList: billDetailList,
                })
            }
            if (data && data.borrowBillList && data.borrowBillList.length) {
                borrowBillList = data.borrowBillList.map(item => {
                    return {
                        ...item,
                        'subject.fullSubjectName':item.subject.fullSubjectName,
                        originApplicationAmount: item.originApplicationAmount ? item.originApplicationAmount : item.applicationAmount,
                        originFormatApplicationAmount: item.originApplicationAmount ? formatNumber(Number(item.originApplicationAmount).toFixed(2)) : formatNumber(Number(item.applicationAmount).toFixed(2))
                    }
                })
                this.setData({
                    importList: borrowBillList,
                })
            }
        } else {
            this.clearCurrencyData(data)
        }
    },
    // 报销类型
    getReimbursementList(reimbursementId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: `${app.globalData.url}reimbursementTypeController.do?getList`,
            method: 'GET',
            success: res => {
                if (res.statusCode == 200) {
                    let reimbursementIndex = 0
                    if (reimbursementId) {
                        res.data.forEach((item, index) => {
                            if (item.id == reimbursementId) {
                                reimbursementIndex = index
                            }
                        })
                    }
                    this.setData({
                        reimbursementList: res.data,
                        reimbursementIndex,
                        submitData: {
                            ...this.data.submitData,
                            reimbursementType: res.data[reimbursementIndex].id
                        }
                    })
                }
            },
        })
    },
})
