import moment from "moment";
import NP from "number-precision";
import '../../../util/handleLodash'
import { cloneDeep as clone } from 'lodash'
import { getErrorMessage, submitSuccess, formatNumber, validFn, request } from "../../../util/getErrorMessage";

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
        type: '',
        billId: '',
        remark: '',
        fileList: [],
        // 采购组织
        accountbookIndex: 0,
        accountbookList: [],
        // 收货组织
        targetAccountbookIndex: 0,
        targetAccountbookList: [],
        // 部门
        departmentIndex: 0,
        departmentList: [],
        // 删除用的status
        status: 0,
        submitData: {
            billFilesObj: [],
            submitDate: moment().format('YYYY-MM-DD'),
            businessDateTime: moment().format('YYYY-MM-DD'),
            status: 20,
            userName: '',
            billCode: '',
            remark: '',
        },
        warehouseAllocateOrderDetailList: [],
    },
    // 把baoxiaoList的数据，重组一下，拼在submitData里提交
    formatSubmitData(array, name) {
        array.forEach((item, index) => {
            Object.keys(item).forEach(keys => {
                console.log(typeof item[keys])
                this.setData({
                    submitData: {
                        ...this.data.submitData,
                        [`${name}[${index}].${keys}`]: item[keys]
                    }
                })
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
        // ==================处理审批流数据==================
        if (this.data.nodeList.length) {
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
            if (item.indexOf('billDetailList') !== -1) {
                delete this.data.submitData[item]
            }
            if (this.data.submitData[item] === null) {
                delete this.data.submitData[item]
            }
        })
        // 处理一下提交格式
        this.formatSubmitData(this.data.warehouseAllocateOrderDetailList, 'billDetailList')
        this.formatSubmitData(this.data.submitData.billFilesObj, 'billFiles')
        this.addLoading()
        var url = ''
        if (this.data.type === 'add') {
            url = app.globalData.url + 'warehouseAllocateBillController.do?doAdd'
            // url = 'http://192.168.10.233:8080/caika/' + 'warehouseAllocateOrderController.do?doAdd'
        } else {
            url = app.globalData.url + 'warehouseAllocateBillController.do?doUpdate&id=' + this.data.billId
        }
        // 处理一下 null 变成字符串的问题
        const submitData = clone(this.data.submitData)
        for (let i in submitData) {
            if (submitData[i] == null || typeof submitData[i] == 'object') {
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
    bindExchangeRateInput(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                exchangeRate: e.detail.value
            }
        })
    },
    bindObjPickerChange(e) {
        var name = e.currentTarget.dataset.name
        var listName = e.currentTarget.dataset.list
        var value = e.detail.value
        var index = e.currentTarget.dataset.index
        // 设置当前框的值
        this.setData({
            [index]: e.detail.value,
            submitData: {
                ...this.data.submitData,
                [name]: this.data[listName][value].id
            }
        })
        if (name === 'targetAccountbookId') {
            this.setData({
                [index]: e.detail.value,
                submitData: {
                    ...this.data.submitData,
                    [name]: this.data[listName][value].targetAccountbookId
                }
            })
            // 获取仓库
            this.getTargetWarehouseList(this.data[listName][value].targetAccountbookId)
        }
        // --------------------------------------------------------
        if (name === 'accountbookId') {
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'originAmount'])
            // 重新获取科目以后，就要置空报销列表
            this.setData({
                warehouseAllocateOrderDetailList: [],
                submitData: {
                    ...this.data.submitData,
                    unitAmouna: '',
                    formatUnitAmount: ''
                },
            })
            // ============ 审批流 =========
            this.setData({
                oaModule: this.findAccountbookOaModule(this.data[listName][value].id, this.data.accountbookList)
            })
            this.showOaProcessByBillType(this.data[listName][value].id, 101)
            // ============ 审批流 =========
            this.getDepartmentList(this.data[listName][value].id)
            // 获取仓库
            this.getSourceWarehouseList(this.data[listName][value].id)
        }
        if (name === 'submitterDepartmentId') {
            this.setData({
                warehouseAllocateOrderDetailList: [],
                submitData: {
                    ...this.data.submitData,
                    unitAmount: '',
                    formatUnitAmount: ''
                },
            })
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
    onBusinessFocus(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                businessDateTime: e.detail.value
            }
        })
    },
    getWarehouseAllocateOrderDetailFromStorage() {
        const index = wx.getStorageSync('index')
        this.setData({
            submitData: {
                ...this.data.submitData,
            }
        })
        wx.getStorage({
            key: 'newWarehouseAllocateOrderDetailArr',
            success: res => {
                const warehouseAllocateOrderDetail = res.data
                if (!!warehouseAllocateOrderDetail) {
                    // 处理wxml模板表达式不识别
                    let warehouseAllocateOrderDetailList = clone(this.data.warehouseAllocateOrderDetailList)
                    if (!!index || index === 0) {
                        warehouseAllocateOrderDetailList.splice(index, 1)
                        warehouseAllocateOrderDetailList.splice(index, 0, warehouseAllocateOrderDetail[0])
                        warehouseAllocateOrderDetailList = warehouseAllocateOrderDetailList.concat(warehouseAllocateOrderDetail.slice(1))
                        this.setData({
                            warehouseAllocateOrderDetailList: warehouseAllocateOrderDetailList
                        })
                    } else {
                        this.setData({
                            warehouseAllocateOrderDetailList: warehouseAllocateOrderDetailList.concat(warehouseAllocateOrderDetail)
                        })
                    }
                    this.setApplicationAmount(this.data.warehouseAllocateOrderDetailList)
                }
            }
        })
        wx.removeStorage({
            key: 'index',
            success: res => {
            }
        })
        wx.removeStorage({
            key: 'newWarehouseAllocateOrderDetailArr',
            success: res => {
            }
        })
    },
    // 价税合计总额
    setApplicationAmount(warehouseAllocateOrderDetailList) {
        let unitAmount = 0
        warehouseAllocateOrderDetailList.forEach(item => {
            unitAmount += Number(item.unitAmount)
        })
        this.setData({
            submitData: {
                ...this.data.submitData,
                unitAmount,
                formatUnitAmount: formatNumber(Number(unitAmount).toFixed(2))
            }
        })
    },
    onShow() {
        // 从缓存获取用户已经选择的审批人
        this.getSelectedUserListFromStorage()
        // 从缓存里获取WarehouseAllocateOrderDetail
        this.getWarehouseAllocateOrderDetailFromStorage()
    },
    // 删除得时候把submitData里面之前存的报销列表数据清空
    clearListSubmitData(submitData) {
        Object.keys(submitData).forEach(key => {
            if (key.indexOf('billDetailList') !== -1) {
                delete submitData[key]
            }
        })
    },
    deleteWarehouseAllocateOrderDetail(e) {
        var idx = e.currentTarget.dataset.index
        var warehouseAllocateOrderDetailList = this.data.warehouseAllocateOrderDetailList.filter((item, index) => {
            return idx !== index
        })
        this.clearListSubmitData(this.data.submitData)
        this.setData({
            warehouseAllocateOrderDetailList
        })
        this.setApplicationAmount(warehouseAllocateOrderDetailList)
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
            success({ filePath }) {
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
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries,
            submitData: {
                ...this.data.submitData,
                userName: app.globalData.realName,
                submitterName: app.globalData.realName,
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
        // ====================================
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
                if (res.statusCode === 200) {
                    const historyOaList = this.handleData(res.data)
                    this.setData({
                        historyOaList: historyOaList.map(item => ({ ...item, showUserList: false, showAssigneeName: item.assigneeName.slice(-2) }))
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
        return arr.length ? arr[0].oaModule : ''
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
    showOaUserNodeListUseField(fields) {
        let result = false
        fields.forEach(field => {
            if (this.data[field] && this.data[field].length) {
                result = true
            } else {
                if (this.data.submitData[field]) {
                    result = true
                } else {
                    result = false
                }
            }
        })
        if (this.data.oaModule && this.data.showOaUserNodeList && result) {
            this.setData({
                showOa: true
            })
            this.getProcess(fields, 101)
        } else {
            this.setData({
                showOa: false
            })
        }
    },
    getOaParams(fields, billType) {
        let params = ''
        fields.forEach(item => {
            if (this.data.submitData[item] || this.data.submitData[item] === 0) {
                params += '&' + item + '=' + this.data.submitData[item]
            } else {
                const applicationAmount = this.data.submitData.applicationAmount ? this.data.submitData.applicationAmount : 0
                params += '&applicationAmount=' + applicationAmount
            }
        })
        params = '&billType=' + billType + params
        return params
    },
    getProcess(fields) {
        const params = this.getOaParams(fields, 101)
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'oaBillConfigController.do?getOAUserList' + params,
            method: 'GET',
            success: res => {
                if (res.data && res.data.length) {
                    const nodeList = res.data.map(node => {
                        node.oaBillUserList = node.oaBillUserList ? node.oaBillUserList : []
                        return {
                            ...node,
                            oaBillUserList: this.handleUserName('showUserName', 'userName', node.oaBillUserList) || [],
                            showOaBillUserList: node.oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName', node.oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName', 'userName', node.oaBillUserList.slice(1)),
                            editable: node.editable,
                            allowMulti: node.allowMulti,
                            nodeTypeName: node.nodeType === 'serviceTask' ? '抄送' : '审批',
                            operate: node.signType === 'and' ? '+' : '/',
                            nodeName: node.nodeName
                        }
                    })
                    this.setData({ nodeList })
                }
            },
        })
    },
    handleUserName(newKey, key, arr) {
        if (arr && arr.length) {
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
                showOaBillUserList: node.oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName', node.oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName', 'userName', node.oaBillUserList.slice(1)),
                editable: node.editable,
                allowMulti: node.allowMulti,
                nodeTypeName: node.nodeType === 'serviceTask' ? '抄送' : '审批',
                operate: node.signType === 'and' ? '+' : '/',
                nodeName: node.nodeName
            }
        })
        if (!!nodeList && nodeList.length) {
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
                if (res && res.data) {
                    const users = this.setSearchArr(res.data)
                    const searchUserList = this.handleUsers(users)
                    wx.setStorageSync('searchUserList', searchUserList)
                    wx.setStorage({
                        key: 'deptList',
                        data: res.data,
                        success: () => {
                            wx.navigateTo({
                                url: '/bill/pages/deptList/index'
                            })
                        }
                    })
                }
            }
        })
    },
    setSearchArr(deptList) {
        let users = []
        for (let i = 0; i < deptList.length; i++) {
            const dept = deptList[i]
            users.concat(this.generateUsername(dept, users))
        }
        return users
    },
    generateUsername(dept, users) {
        const userList = dept.userList || []
        const subDepartList = dept.subDepartList || []
        if (userList.length) {
            userList.forEach(item => {
                users.push(item)
            })
        }
        if (subDepartList.length) {
            subDepartList.forEach(subDepart => {
                users.concat(this.generateUsername(subDepart, users))
            })
        }
        return users
    },
    handleUsers(users) {
        const newUsers = []
        if (users.length) {
            const obj = {}
            users.reduce((prev, cur) => {
                obj[cur.id] ? '' : obj[cur.id] = true && prev.push(cur)
                return prev
            }, newUsers)
        }
        return newUsers
    },
    removeUser(e) {
        const id = e.currentTarget.dataset.id
        const nodeIndex = e.currentTarget.dataset.index
        this.data.nodeList[nodeIndex].oaBillUserList = this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.filter(item => item.id !== id))
        this.data.nodeList[nodeIndex].showOaBillUserList = this.data.nodeList[nodeIndex].oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.slice(1))
        this.setData({
            nodeList: this.data.nodeList,
            nodeIndex,
            selectedUserList: this.data.nodeList[nodeIndex]
        })
    },
    getSelectedUserListFromStorage() {
        const selectedUsers = wx.getStorageSync('selectedUsers') || []
        const nodeIndex = wx.getStorageSync('nodeIndex')
        let currentNodeList = []
        if (selectedUsers.length && nodeIndex !== null) {
            currentNodeList = selectedUsers[nodeIndex].map(item => ({ ...item, removable: true }))
        }
        if (!!currentNodeList && nodeIndex !== null) {
            if (this.data.nodeList[nodeIndex]) {
                // 把用户刚选择的和之前已经选择的混合在一起
                this.data.nodeList[nodeIndex].oaBillUserList = this.data.nodeList[nodeIndex].oaBillUserList.concat(currentNodeList)
                // 然后去重
                this.data.nodeList[nodeIndex].oaBillUserList = this.handleUsers(this.data.nodeList[nodeIndex].oaBillUserList)
                this.data.nodeList[nodeIndex].oaBillUserList = this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList)
                this.data.nodeList[nodeIndex].showOaBillUserList = this.data.nodeList[nodeIndex].oaBillUserList.length > 3 ? this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.slice(1, 4)) : this.handleUserName('showUserName', 'userName', this.data.nodeList[nodeIndex].oaBillUserList.slice(1))
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
        wx.removeStorage({ key: 'selectedUsers' })
        wx.removeStorage({ key: 'nodeIndex' })
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
    // 从所有收货组织中找到结算间关系中需要的数据
    handleAccountbookList(accountbookId, list) {
        if (list && list.length) {
            return list.filter(item => item.purchaseAccountbookId === accountbookId)
                .map(item => ({ targetAccountbookName: item.saleAccountbookName, targetAccountbookId: item.saleAccountbookId }))
        }
        return []
    },
    // 获取收货组织
    getAccountbookReceiveList(accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading(),
            url: `${app.globalData.url}jxcAccountbookSettlementController.do?datagrid&field=id,saleAccountbookId,saleAccountbookName,purchaseAccountbookId,purchaseAccountbookName,priceListId,priceListCode,priceListName`,
            method: 'GET',
            success: res => {
                const arr = this.handleAccountbookList(this.data.submitData.accountbookId, res.data.rows)
                console.log(arr, 'arr')
                // edit 的时候设置departmentIndex
                var targetAccountbookIndex = 0
                var targetAccountbookId = !!accountbookId ? accountbookId : arr[arr.length - 1].targetAccountbookId
                if (targetAccountbookId) {
                    arr.forEach((item, index) => {
                        if (item.targetAccountbookId === targetAccountbookId) {
                            targetAccountbookIndex = index
                        }
                    })
                }
                this.setData({
                    targetAccountbookList: arr,
                    targetAccountbookIndex,
                    submitData: {
                        ...this.data.submitData,
                        targetAccountbookId
                    }
                })
                // 获取仓库
                this.getTargetWarehouseList(targetAccountbookId)
            }
        })
    },
    // 获取调出仓库
    getSourceWarehouseList(accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading(),
            url: `${app.globalData.url}warehouseController.do?getWarehouseList&accountbookId=${accountbookId}`,
            method: 'GET',
            success: res => {
                wx.setStorage({
                    key: 'sourceWarehouseList',
                    data: res.data.map(item => ({ warehouseId: item.id, warehouseName: item.warehouseName }))
                })
                wx.setStorage({
                    key: 'sourceAccountbookId',
                    data: accountbookId
                })
            }
        })
    },
    // 获取调入仓库
    getTargetWarehouseList(accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading(),
            url: `${app.globalData.url}warehouseController.do?getWarehouseList&accountbookId=${accountbookId}`,
            method: 'GET',
            success: res => {
                wx.setStorage({
                    key: 'targetWarehouseList',
                    data: res.data.map(item => ({ warehouseId: item.id, warehouseName: item.warehouseName }))
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
                    if (res.data.success && res.data.obj.length) {
                        var accountbookIndex = 0
                        var accountbookId = !!data ? data.accountbookId : res.data.obj[0].id
                        // ============ 审批流 =========
                        this.setData({
                            oaModule: this.findAccountbookOaModule(accountbookId, res.data.obj)
                        })
                        this.showOaProcessByBillType(accountbookId, 101)
                        // ============ 审批流 =========
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
                                accountbookId,
                            }
                        })
                        var submitterDepartmentId = data ? data.submitterDepartmentId : ''
                        var billDetailList = data ? data.billDetailList : []
                        var targetAccountbookId = data ? data.targetAccountbookId : ''
                        // 获取收货组织
                        this.getAccountbookReceiveList(targetAccountbookId)
                        this.getDepartmentList(accountbookId, submitterDepartmentId, billDetailList)
                        // 获取调出仓库
                        this.getSourceWarehouseList(accountbookId)
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
                })()
            }
        })
    },
    // 获取申请部门
    getDepartmentList(accountbookId, departmentId, billDetailList) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'newDepartController.do?departsJson&accountbookId=' + accountbookId,
            method: 'GET',
            dataType: 'json',
            success: res => {
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
                        },
                    })
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
            }
        })
    },
    // 组成初始详情数据
    generateBaseDetail() {
        var obj = {
            remark: '',
            goodsId: '',
            goodsName: '',
            goodsCode: '',
            goodsSpecs: '',
            auxiliaryAttributeName: '',
            unitId: '',
            sourceWarehouseId: '',
            targetWarehouseId: '',
            stockAmount: '',
            unitAmount: '',
        }
        return obj
    },
    onAddWarehouseAllocateOrderDetail() {
        var obj = this.generateBaseDetail()
        wx.setStorage({
            key: 'initWarehouseAllocateOrderDetail',
            data: obj,
            success: res => {
                console.log('写入报销详情成功...')
                wx.navigateTo({
                    url: '/jxc/pages/warehouseAllocateOrderDetail/index'
                })
            }
        })
    },
    // 请求编辑回显数据
    getEditData(id) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'warehouseAllocateBillController.do?getWarehouseAllocateBill&id=' + id,
            method: 'GET',
            dataType: 'json',
            success: res => {
                console.log(res, '获取库存调拨编辑回显')
                if (res.data) {
                    this.setRenderData(res.data)
                    this.getProcessInstance(id, res.data.accountbookId)
                }
            }
        })
    },
    // 回显数据设置
    setRenderData(data) {
        // 请求
        this.getAccountbookList(data)
        // billDetailList
        if(data.billDetailList && data.billDetailList.length) {
            var warehouseAllocateOrderDetailList = data.billDetailList.map(item => ({
                ...item,
                goodsCode: item.goods.goodsCode,
                goodsName: item.goods.goodsName,
                formatUnitAmount: formatNumber(Number(item.unitAmount).toFixed(2))
            }))
        }
        //fileList
        if (data.billFiles.length) {
            var billFilesObj = data.billFiles.map(item => {
                delete item.createDate
                delete item.updateDate
                return item
            })
        }

        // 设置数据
        this.setData({
            ...this.data,
            warehouseAllocateOrderDetailList,
            status: data.status,
            submitData: {
                ...this.data.submitData,
                billFilesObj: billFilesObj || [],
                submitDate: moment().format('YYYY-MM-DD'),
                businessDateTime: data.businessDateTime.split(' ')[0],
                unitAmount: data.unitAmount,
                formatUnitAmount: formatNumber(Number(data.unitAmount).toFixed(2)),
                status: data.status,
                remark: data.remark,
                userName: app.globalData.realName,
                accountbookId: data.accountbookId,
                billCode: data.billCode,
            },
        })
        let t = null
        t = setTimeout(() => {
            this.showOaUserNodeListUseField(['accountbookId', 'submitterDepartmentId', 'originAmount'])
            this.setRenderProgress(JSON.parse(data.oaBillUserNodeListJson) || [])
            clearTimeout(t)
            t = null
        })
    },
    showWarehouseAllocateOrderDetail(e) {
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
        var obj = this.generateBaseDetail()
        wx.setStorage({
            key: 'index',
            data: index,
            success: res => {
                console.log('index设置成功...')
            }
        })
        wx.setStorage({
            key: 'warehouseAllocateOrderDetail',
            data: this.data.warehouseAllocateOrderDetailList[index],
            success: res => {
                console.log(this.data.warehouseAllocateOrderDetailList[index])
                console.log('写入采购订单详情成功！！')
                wx.setStorage({
                    key: 'initWarehouseAllocateOrderDetail',
                    data: obj,
                    success: res => {
                        this.hideLoading()
                        wx.navigateTo({
                            url: '/jxc/pages/warehouseAllocateOrderDetail/index'
                        })
                    }
                })
            }
        })
    },
    goInfoList() {
        wx.navigateTo({
            url: '/bill/pages/infoList/index'
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
                if (res.confirm) {
                    this.addLoading()
                    request({
                        hideLoading: this.hideLoading,
                        url: app.globalData.url + 'warehouseAllocateBillController.do?doBatchDel&ids=' + this.data.billId,
                        method: 'GET',
                        success: res => {
                            console.log(res)
                            if (res.data.success) {
                                wx.navigateBack({
                                    delta: 1
                                })
                            } else {
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
            url: app.globalData.url + 'weixinController.do?getProcessinstanceJson&billType=101&billId=' + billId + '&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                console.log(res, '审批流')
                if (res.data && res.data.length) {
                    const { operationRecords, ccUserids } = res.data[0]

                    // 抄送人
                    let cc = []
                    if (ccUserids && ccUserids.length) {
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
                        if (item.operationResult == 1) {
                            item.resultName = '（审批中）'
                        } else if (item.operationResult == 2) {
                            item.resultName = '（已同意）'
                        } else if (item.operationResult == 3) {
                            item.resultName = '（已驳回）'
                        } else {
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
