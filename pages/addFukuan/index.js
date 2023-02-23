import moment from "moment";
import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {getErrorMessage, submitSuccess, formatNumber, validFn, request} from "../../util/getErrorMessage";

var app = getApp()
app.globalData.loadingCount = 0
Page({
    data: {
        // 增加申请人
        realName: '',
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
        // 删除用的status
        status: 0,
        submitData: {
            billFilesObj: [],
            submitDate: moment().format('YYYY-MM-DD'),
            applicantType: 20,
            applicantId: '',
            invoice: 1,
            businessDateTime: moment().format('YYYY-MM-DD'),
            applicationAmount: 0,
            formatApplicationAmount: 0,
            formatTotalAmount: 0,
            totalAmount: 0,
            formatVerificationAmount: 0,
            status: 20,
            userName: '',
            billCode: '',
        },
        fukuanList: [],
        importList: [],
        tempImportList: [],
    },
    // 把fukuanList的数据，重组一下，拼在submitData里提交
    formatSubmitData(array, name) {
        array.forEach((item, index) => {
            Object.keys(item).forEach(keys => {
                if (item[keys] instanceof Array && keys.indexOf('billDetail') !== -1) {
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
                    this.setData({
                        submitData: {
                            ...this.data.submitData,
                            [`${name}[${index}].${keys}`]: item[keys]
                        }
                    })
                }
            })
        })
    },
    addLoading() {
        if (app.globalData.loadingCount < 1) {
            wx.showLoading({
                title: '加载中...',
                mask: true,
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
            if(item.indexOf('billDetailList') != -1) {
                delete this.data.submitData[item]
            }
        })
        // 处理一下提交格式
        this.formatSubmitData(this.data.fukuanList, 'billDetailList')
        // 提交的时候删除借款科目
        this.data.importList.forEach(item => {
            delete item['subject.fullSubjectName']
        })
        this.formatSubmitData(this.data.importList, 'borrowBillList')
        this.formatSubmitData(this.data.submitData.billFilesObj, 'billFiles')
        this.addLoading()
        var url = ''
        if (this.data.type === 'add') {
            url = app.globalData.url + 'paymentBillController.do?doAdd'
        } else {
            url = app.globalData.url + 'paymentBillController.do?doUpdate&id=' + this.data.billId
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
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'fukuanList', 'totalAmount'])
            // 重新获取科目以后，就要置空报销列表
            this.setData({
                fukuanList: [],
                submitData: {
                    ...this.data.submitData,
                    taxpayerType: this.data.accountbookList[value].taxpayerType,
                    applicationAmount: '',
                    totalAmount: '',
                    verificationAmount: ''
                },
            })
            // ============ 审批流 =========
            this.setData({
                oaModule: this.findAccountbookOaModule(this.data[listName][value].id, this.data.accountbookList)
            })
            this.showOaProcessByBillType(this.data[listName][value].id, 3)
            // ============ 审批流 =========
            this.setTotalAmount()
            this.getDepartmentList(this.data[listName][value].id)
            this.getBorrowBillList(this.data[listName][value].id, 20, null, null, true)
        }
        if (name === 'submitterDepartmentId') {
            // 重新获取科目以后，就要置空报销列表
            this.setData({
                fukuanList: [],
                submitData: {
                    ...this.data.submitData,
                    applicationAmount: '',
                    totalAmount: '',
                    verificationAmount: '',
                },
            })
            this.setTotalAmount()
            this.getBorrowBillList(this.data.submitData.accountbookId, 20, null, null, true)
        }
        if (name === 'incomeBankName') {
            this.setIncomeBankAccount(this.data[listName][value].bankAccount)
        }
    },
    onBlur(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                [e.currentTarget.dataset.name]: e.detail.value
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
    },
    // 获取修改后的付款详情
    getFukuanDetailFromStorage() {
        const fukuanDetail = wx.getStorageSync('fukuanDetail')
        const index = wx.getStorageSync('index')
        console.log(fukuanDetail, '获取缓存后的付款详情')
        if(!!fukuanDetail) {
            const tempData = clone(this.data.fukuanList)
            tempData[index] = fukuanDetail
            this.setData({
                fukuanList: tempData
            })
            wx.removeStorage({
                key: 'fukuanDetail'
            })
            wx.removeStorage({
                key: index
            })
            this.setApplicationAmount(this.data.fukuanList)
            this.setTotalAmount()
            this.handleSubjectName()
        }
    },
    getBorrowIdFromStorage() {
        // 从缓存里获取借款人id
        const borrowId = wx.getStorageSync('borrowId')
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
            // 清空之前导入的应付单
            this.setData({
                fukuanList: []
            })
            this.setApplicationAmount(this.data.fukuanList)
            this.setTotalAmount()
            this.getIncomeBankList(this.data.submitData.applicantType, borrowId)
            // 清理借款人缓存
            wx.removeStorage({
                key: 'borrowId',
                success: function () {
                    console.log('借款人缓存删除成功')
                }
            });
        }
    },
    handleSubjectName() {
        const fukuanList = this.data.fukuanList.map(item => {
            if(item.subjectName) {
                return {
                    ...item,
                    subjectName: item.subjectName.indexOf('_') != -1 ? item.subjectName.split('_')[item.subjectName.split('_').length - 1] : item.subjectName
                }
            }
            return {
                ...item,
                subjectName: item.trueSubjectName.indexOf('_') != -1 ? item.trueSubjectName.split('_')[item.trueSubjectName.split('_').length - 1] : item.trueSubjectName
            }
        })
        this.setData({
            fukuanList
        })
    },
    // 获取导入的应付单
    getImportFukuanListFromStorage() {
        const fukuanList = wx.getStorageSync('importCommonList')
        console.log(this.data.fukuanList, 'this.data.fukuanList')
        if(!!fukuanList) {
            let oldList = this.data.fukuanList.concat()
            console.log(oldList, 'oldList')
            console.log(fukuanList)
            if(oldList.length) {
                for(let i = 0; i < fukuanList.length; i++) {
                    if(oldList.every(item => item.billDetailId !== fukuanList[i].billDetailId)) {
                        oldList.push(fukuanList[i])
                    }else{
                        oldList = oldList.map(item => {
                            if(item.billDetailId === fukuanList[i].billDetailId) {
                                return Object.assign({}, item, fukuanList[i])
                            }else{
                                return item
                            }
                        })
                    }
                    this.setData({
                        fukuanList: oldList
                    })
                }
            }else{
                this.setData({
                    fukuanList: oldList.concat(fukuanList)
                })
            }
            // 发票
            this.setAccountbookId(this.data.submitData.accountbookId, clone(this.data.fukuanList))

            this.setApplicationAmount(this.data.fukuanList)
            this.setTotalAmount()
            this.handleSubjectName()
            wx.removeStorageSync('importCommonList')
        }
    },
    setAccountbookId(accountbookId, data) {
        if(data && data.length) {
            data.forEach(item => {
                item.accountbookId = accountbookId
            })
            this.setData({
                fukuanList: data
            })
        }
    },
    getSelectedBorrowListFromStorage() {
        wx.getStorage({
            key: 'importList',
            success: res => {
                const importList = res.data
                if (!!importList && importList.length) {
                    console.log('获取选择的借款列表成功', importList)
                    const newImportList = this.caculateImportList(importList)
                    console.log(newImportList, 'newImportList')
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
                console.log('清除imoprtList成功...')
            }
        })
    },
    caculateImportList(importList, inputValue, index) {
        let totalApplicationAmount = Number(this.data.submitData.applicationAmount)
        const newImportList = importList.map(item => {
            let applicationAmount = totalApplicationAmount - Number(item.applicationAmount)
            if(applicationAmount <= 0 && totalApplicationAmount > 0) {
                applicationAmount = totalApplicationAmount
                totalApplicationAmount = 0
            }else if(applicationAmount <= 0 && totalApplicationAmount <= 0){
                applicationAmount = 0
                totalApplicationAmount = 0
            }else{
                applicationAmount = item.applicationAmount
                totalApplicationAmount = totalApplicationAmount - Number(item.applicationAmount)
            }
            return {
                ...item,
                formatUnverifyAmount: formatNumber(item.unverifyAmount),
                applicationAmount
            }
        })
        return newImportList
    },
    onShow() {
        this.getSelectedUserListFromStorage()
        // 从缓存获取修改的付款详情
        this.getFukuanDetailFromStorage()
        // 从缓存获取付款列表
        this.getImportFukuanListFromStorage()
        // 从缓存里获取借款列表
        this.getSelectedBorrowListFromStorage()
        // 从缓存里获取借款人id
        this.getBorrowIdFromStorage()
    },
    // 删除得时候把submitData里面之前存的报销列表数据清空
    clearListSubmitData(submitData) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf('billDetailList') != -1) {
                delete submitData[key]
            }
        })
    },
    deleteFukuanDetail(e) {
        var idx = e.currentTarget.dataset.index
        var fukuanList = this.data.fukuanList.filter((item, index) => {
            return idx !== index
        })
        this.clearListSubmitData(this.data.submitData)
        this.setData({
            fukuanList
        })
        this.setApplicationAmount(fukuanList)
        this.setTotalAmount()
    },
    // 删除得时候把submitData里面之前存的报销列表数据清空
    clearFileList(submitData) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf('billFiles') != -1) {
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
                console.log(res)
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
                console.log(res)
                var billFilesList = []
                res.forEach(item => {
                    billFilesList.push(item)
                })
                this.setData({
                    submitData: {
                        ...this.data.submitData,
                        billFilesObj: this.data.submitData.billFilesObj.concat(billFilesList)
                    }
                })
            }).catch(error => {
                this.hideLoading()
                console.log(error, 'catch')
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
        console.log(url)
        wx.downloadFile({
            url,
            success({filePath}) {
                console.log(filePath)
                wx.previewImage({
                    urls: [filePath]
                })
            }
        })
    },
    onHide() {
    },
    onLoad(query) {
        // 增加申请人
        this.setData({
            realName: app.globalData.realName
        })
        app.globalData.loadingCount = 0
        this.getTaxRageArr()
        this.getInvoiceTypeArr()
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries,
            submitData: {
                ...this.data.submitData,
                userName: app.globalData.realName,
            }
        })
        var type = query.type
        this.setData({
            type
        })
        var id = query.id
        // ======================================
        // id = '2c91e3e9759c635f01759cec38b900c0'
        // type = 'edit'
        // ======================================
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
                if(res.status === 200) {
                    const historyOaList = this.handleData(res.data)
                    this.setData({
                        historyOaList: historyOaList.map(item => ({...item, showUserList: false}))
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
        const arr = accountbookList.filter(item => item.id === accountbookId)
        if(arr && arr.length) {
            return accountbookList.filter(item => item.id === accountbookId)[0].oaModule
        }
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
        console.log(result, 'result......')
        if(this.data.oaModule && this.data.showOaUserNodeList && result) {
            this.setData({
                showOa: true
            })
            this.getProcess(fields, 3)
        }else{
            this.setData({
                showOa: false
            })
        }
    },
    getOaParams(fields, billType) {
        let params = ''
        fields.forEach(item => {
            if(this.data.submitData[item]) {
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
        const params = this.getOaParams(fields, 3)
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
                console.log(res, '税率')
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
                console.log(res.data, 'accountbookList')
                console.log(data)
                if(res.data.success && res.data.obj.length) {
                    var accountbookIndex = 0
                    var taxpayerType = null;
                    var accountbookId = !!data ? data.accountbookId : res.data.obj[0].id
                    // ============ 审批流 =========
                    this.setData({
                        oaModule: this.findAccountbookOaModule(accountbookId, res.data.obj)
                    })
                    this.showOaProcessByBillType(accountbookId, 3)
                    // ============ 审批流 =========
                    // edit的时候设置值
                    if (accountbookId) {
                        res.data.obj.forEach((item, index) => {
                            if (item.id === accountbookId) {
                                accountbookIndex = index
                                taxpayerType = item.taxpayerType
                            }
                        })
                    }
                    console.log(taxpayerType,' taxpayerType')
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
                    var applicantId = data ? data.applicantId : ''
                    var applicantType = this.data.submitData.applicantType
                    var incomeBankName = data ? data.incomeBankName : ''
                    var billDetailList = data ? data.billDetailList : []
                    this.getBorrowBillList(accountbookId, applicantType, applicantId, incomeBankName)
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
    getBorrowBillList(accountbookId, applicantType, applicant, incomeBankName) {
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
                // 默认不选中
                arr.unshift({
                    id: '',
                    name: '请选择'
                })
                // edit的时候，设置borrowIndex
                var borrowIndex = 0
                var applicantId = ''
                applicantId = this.data.submitData.applicantId || arr[0].id
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
    // 获取应付单列表并且跳转
    getYingfuList() {
        if(!this.data.submitData.applicantId) {
            wx.showModal({
                content: '请选择供应商',
                confirmText: '好的',
                showCancel: false,
            })
           return
        }
        this.addLoading()
        request({
            url: app.globalData.url + 'payableBillController.do?datagrid&supplierId='+this.data.submitData.applicantId+'&query=import&field=id,billCode,accountbookId,accountbookName,submitterId,submitterName,submitterDepartmentId,departName,supplierId,supplierName,invoiceType,subjectId,trueSubjectId,subjectName,trueSubjectName,auxpropertyNames,taxRate,amount,unverifyAmount,submitDateTime,businessDateTime,remark,',
            method: 'GET',
            success: res => {
                if(res.data.rows.length) {
                    // 发票
                    wx.setStorageSync(
                        'accountbookId',
                        this.data.submitData.accountbookId
                    )
                    wx.setStorage({
                        key: 'tempImportList',
                        data: res.data.rows,
                        success: res => {
                           this.hideLoading()
                           wx.navigateTo({
                               url: '/pages/importYingshouList/index?origin=fukuan'
                           })
                        }
                    })
                }else{
                    this.hideLoading()
                    wx.showModal({
                        content: '暂无应付单',
                        confirmText: '好的',
                        showCancel: false,
                        success: () => {
                        }
                    })
                }
            }
        })
    },
    // 编辑付款详情
    showFukuanDetail(e) {
        const index = e.currentTarget.dataset.index
        // 发票
        wx.setStorageSync(
            'accountbookId',
            this.data.submitData.accountbookId
        )
        wx.setStorage({
            key: 'index',
            data: index,
            success: res => {
                console.log('index设置成功...')
            }
        })
        const fukuanDetail = clone(this.data.fukuanList[index])
        wx.setStorage({
            key: 'fukuanDetail',
            data: fukuanDetail,
            success() {
                wx.navigateTo({
                    url: '/pages/fukuanDetail/index'
                })
            }
        })
    },
    // 请求编辑回显数据
    getEditData(id) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'paymentBillController.do?getDetail&id=' + id,
            method: 'GET',
            dataType: 'json',
            success: res => {
                console.log(res, '付款单编辑的数据')
                if (res.data.obj) {
                    this.setRenderData(res.data.obj)
                    this.handleSubjectName()
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
            return {
                "subject.fullSubjectName": item.subject.fullSubjectName,
                billDetailId: item.billDetailId,
                remark: item.remark,
                applicationAmount: item.applicationAmount,
                unverifyAmount: item.unapplicationAmount,
                formatApplicationAmount: formatNumber(Number(item.applicationAmount)),
            }
        })
        //fileList
        if (data.billFiles.length) {
            var billFilesObj = data.billFiles.map(item => {
                return item
            })
        }

        // billDetailList
        if(data.billDetailList.length) {
            var fukuanList = data.billDetailList.map(item => ({
                applicationAmount: item.applicationAmount,
                formatApplicationAmount: formatNumber(Number(item.applicationAmount).toFixed(2)),
                auxpropertyNames: item.auxpropertyNames,
                id: item.id,
                billCode: item.relationbillCode,
                billDetailId: item.billDetailId,
                subjectName: item.subject.fullSubjectName,
                'subject.fullSubjectName': item.subject.fullSubjectName,
                subjectId: item.subjectId,
                remark: item.remark,
                taxRate: item.taxRate,
                invoiceType: item.invoiceType,
                invoiceInfoId: item.invoiceInfoId
            }))
        }else{
            var fukuanList = []
        }

        // 设置数据
        this.setData({
            ...this.data,
            fukuanList,
            importList,
            status: data.status,
            submitData: {
                ...this.data.submitData,
                billFilesObj: billFilesObj || [],
                submitDate: moment().format('YYYY-MM-DD'),
                applicantId: data.applicantId,
                invoice: data.invoice,
                businessDateTime: data.businessDateTime.split(' ')[0],
                applicationAmount: data.applicationAmount,
                formatApplicationAmount: formatNumber(Number(data.applicationAmount).toFixed(2)),
                verificationAmount: data.verificationAmount,
                formatVerificationAmount: formatNumber(Number(data.verificationAmount).toFixed(2)),
                totalAmount: data.totalAmount,
                formatTotalAmount: formatNumber(Number(data.totalAmount).toFixed(2)),
                status: data.status,
                remark: data.remark,
                userName: app.globalData.realName,
                accountbookId: data.accountbookId,
                billCode: data.billCode,
            },
        })
        let t = null
        t = setTimeout(() => {
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'fukuanList', 'totalAmount'])
            this.setRenderProgress(JSON.parse(data.oaBillUserNodeListJson))
            t = null
        })
    },
    getImportBorrowList() {
        if(!this.data.submitData.applicantId) {
            wx.showModal({
                content: '请选择供应商',
                confirmText: '好的',
                showCancel: false,
            })
            return
        }
        if(!this.data.fukuanList.length) {
            wx.showModal({
                content: '请先导入应付单',
                confirmText: '好的',
                showCancel: false,
            })
            return
        }
        const invoice = this.data.submitData.invoice == 0 ? 1 : 0
        if(this.data.clickFlag) {
            this.setData({
                clickFlag: false
            })
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: app.globalData.url + 'borrowBillController.do?dataGridManager&accountbookId=' + this.data.submitData.accountbookId + '&applicantType=' + this.data.submitData.applicantType + '&applicantId=' + this.data.submitData.applicantId + '&invoice=' + invoice + '&query=import&field=id,billCode,accountbookId,departDetail.id,departDetail.depart.departName,applicantId,applicantName,subjectId,subject.fullSubjectName,auxpropertyNames,submitter.id,submitter.realName,invoice,contractNumber,currencyTypeId,amount,originAmount,unverifyAmount,originUnverifyAmount,remark,businessDateTime,submitDate',
                method: 'GET',
                success: res => {
                    if(res.data.rows.length) {
                        wx.setStorage({
                            key: 'tempImportList',
                            data: res.data.rows,
                            success: res => {
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
        tempData[index].applicationAmount = value
        tempData[index].formatApplicationAmount = formatNumber(Number(value).toFixed(2))
        const newImportList = this.caculateImportList(tempData, value, index)
        // 验证输入
        if(Number(value) - Number(newImportList[index].applicationAmount) > 0) {
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
                borrowTotalAmount += Number(item.applicationAmount)
            })
        }
        this.setData({
            submitData: {
                ...this.data.submitData,
                verificationAmount: borrowTotalAmount,
                formatVerificationAmount: formatNumber(Number(borrowTotalAmount).toFixed(2))
            }
        })
        return borrowTotalAmount
    },
    setApplicationAmount(array) {
        var applicationAmount = 0
        if (array.length) {
            array.forEach(item => {
                applicationAmount += Number(item.applicationAmount)
            })
        }
        this.setData({
            submitData: {
                ...this.data.submitData,
                applicationAmount:applicationAmount,
                formatApplicationAmount: formatNumber(Number(applicationAmount).toFixed(2))
            }
        })
        return applicationAmount
    },
    setTotalAmount() {
        // 申请报销金额
        var applicationAmount = this.setApplicationAmount(this.data.fukuanList) || 0
        // 核销金额
        var verificationAmount = this.setBorrowAmount(this.data.importList) || 0
        // 应付款金额
        var totalAmount = Number(applicationAmount) - Number(verificationAmount)
        // 记录一下计算之前的totalAmount
        var oldTotalAmount = this.data.submitData.totalAmount
        this.setData({
            submitData: {
                ...this.data.submitData,
                totalAmount: totalAmount,
                formatTotalAmount: formatNumber(Number(totalAmount).toFixed(2))
            }
        })
        if(totalAmount != oldTotalAmount) {
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'fukuanList', 'totalAmount'])
        }
    },
    clearBorrowList(submitData) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf('borrowBillList') != -1) {
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
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该单据吗?',
            confirmText: '是',
            cancelText: '否',
            success: res => {
                if(res.confirm) {
                    this.addLoading()
                    request({
                        hideLoading: this.hideLoading,
                        url: app.globalData.url + 'paymentBillController.do?doBatchDel&ids=' + this.data.billId,
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
            url: app.globalData.url + 'weixinController.do?getProcessinstanceJson&billType=3&billId=' + billId + '&accountbookId=' + accountbookId,
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
})
