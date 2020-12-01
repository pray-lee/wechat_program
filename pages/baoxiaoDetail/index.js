import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {formatNumber, validFn, request} from "../../util/getErrorMessage";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        noticeHidden: true,
        baoxiaoDetail: {},
        baoxiaoArr: [],
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        const isEdit = wx.getStorageSync('edit')
        const initBaoxiaoDetail = wx.getStorageSync('initBaoxiaoDetail')
        const baoxiaoDetail = wx.getStorageSync('baoxiaoDetail')
        if (!baoxiaoDetail) {
            this.setData({
                baoxiaoDetail: initBaoxiaoDetail
            })
            const taxpayerType = this.data.baoxiaoDetail.taxpayerType
        } else {
            if (isEdit) {
                this.getSubjectAuxptyList(baoxiaoDetail.subjectId, baoxiaoDetail.accountbookId, false)
                wx.removeStorage({
                    key: 'edit',
                    success: res => {
                        console.log('清除isEdit成功')
                    }
                })
            }
            this.setData({
                baoxiaoDetail: baoxiaoDetail,
            })
            console.log(baoxiaoDetail, '..................')
        }
        console.log('onLoad')
    },
    getBorrowIdFromStorage() {
        // 从缓存里获取借款人id
        const borrowId = wx.getStorageSync('borrowId')
        if (!!borrowId) {
            var borrowIndex = 0
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
            setTimeout(() => {
                this.getIncomeBankList(this.data.submitData.applicantType, borrowId)
            })
        }
    },
    getAuxptyIdFromStorage() {
        // 从缓存里获取auxpty
        const auxpty = wx.getStorageSync('auxpty')
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
                baoxiaoDetail: {
                    ...this.data.baoxiaoDetail,
                    selectedAuxpty: null,
                    subjectId: subject.id,
                    subjectExtraId: subject.subjectExtraId,
                    subjectName: subject.name,
                    billDetailTrueApEntityListObj: [],
                    billDetailApEntityListObj: [],
                    applicationAmount: '',
                }
            })
            wx.removeStorage({
                key: 'subject'
            })
            this.getSubjectAuxptyList(subject.id, this.data.baoxiaoDetail.accountbookId, true)
        }
    },
    onShow() {
        setTimeout(() => {
            this.getAuxptyIdFromStorage()
            this.getBorrowIdFromStorage()
            this.getSubjectIdFromStorage()
        }, 300)
        const baoxiaoDetail = wx.getStorageSync('baoxiaoDetail')
        if (!!baoxiaoDetail) {
            this.setData({
                baoxiaoDetail,
                noticeHidden: baoxiaoDetail.invoiceType == 2 ? false : true
            })
        }else{
            this.setData({
                noticeHidden: this.data.baoxiaoDetail.invoiceType == 2 ? false: true
            })
        }

        wx.removeStorage({
            key: 'baoxiaoDetail',
            success: res => {
                console.log('清除编辑详情数据成功...')
            }
        })
    },
    onBaoxiaoBlur(e) {
        var tempData = clone(this.data.baoxiaoDetail)
        var name = e.currentTarget.dataset.name
        const numberReg = /^\d+(\.\d+)?$/
        tempData[name] = e.detail.value
        if (name === 'applicationAmount') {
            if(!numberReg.test(e.detail.value)) {
                wx.showModal({
                    content: '请输入合法的报销金额',
                    confirmText: '确定',
                    showCancel: false,
                    success: res => {
                        return
                    }
                })
            }
            tempData['formatApplicationAmount'] = formatNumber(Number(e.detail.value).toFixed(2))
        }
        this.setData({
            baoxiaoDetail: tempData,
        })
    },
    baoxiaoRadioChange(e) {
        var value = e.detail.value ? 2 : 1
        var baoxiaoItem = clone(this.data.baoxiaoDetail)
        baoxiaoItem.invoiceType = value
        if (value == 2) {
            baoxiaoItem.taxRageArr = baoxiaoItem.taxRageObject.taxRageArr
            baoxiaoItem.taxRageIndex = 0
            baoxiaoItem.taxRate = baoxiaoItem.taxRageObject.taxRageArr[0].id
            baoxiaoItem.noticeHidden = false
            this.setData({
                baoxiaoDetail: baoxiaoItem,
                noticeHidden: false
            })
        } else {
            baoxiaoItem.taxRageArr = []
            baoxiaoItem.taxRageIndex = 0
            baoxiaoItem.taxRate = ''
            baoxiaoItem.noticeHidden = true
            this.setData({
                baoxiaoDetail: baoxiaoItem,
                noticeHidden: true
            })
        }
    },
    // 税率点击
    bindTaxRagePickerChange(e) {
        var baoxiaoItem = clone(this.data.baoxiaoDetail)
        var value = e.detail.value
        baoxiaoItem.taxRageIndex = value
        baoxiaoItem.taxRate = baoxiaoItem.taxRageArr[value].id
        this.setData({
            baoxiaoDetail: baoxiaoItem
        })
    },
    // 获取科目对应的辅助核算 (每一个都是单独调用)
    getSubjectAuxptyList(subjectId, accountbookId, flag) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'subjectStartDetailController.do?getInfo&subjectId=' + subjectId + '&accountbookId=' + accountbookId,
            method: 'GET',
            success: res => {
                if (!!res.data.obj.subjectAuxptyList.length) {
                    var arr = res.data.obj.subjectAuxptyList.map(item => {
                        return {
                            auxptyId: item.auxptyId,
                            auxptyName: item.auxpropertyConfig.auxptyName
                        }
                    })
                    this.setData({
                        baoxiaoDetail: {
                            ...this.data.baoxiaoDetail,
                            subjectAuxptyList: arr
                        }
                    })
                    arr.forEach(item => {
                        this.getAuxptyList(accountbookId, item.auxptyId, flag)
                    })
                } else {
                    this.setData({
                        baoxiaoDetail: {
                            ...this.data.baoxiaoDetail,
                            subjectAuxptyList: [],
                            allAuxptyList: {},
                        }
                    })
                }
            }
        })
    },
    // 请求辅助核算列表
    getAuxptyList(accountbookId, auxptyid, flag) {
        console.log(auxptyid, 'auxptyid')
        console.log(this.data.baoxiaoDetail)
        this.addLoading()
        let url = this.getAuxptyUrl(accountbookId, auxptyid)
        if(auxptyid == 2 && this.data.baoxiaoDetail.applicantType == 10) {
            url = url + '&id=' + this.data.baoxiaoDetail.applicantId
        }
        if(auxptyid == 3 && this.data.baoxiaoDetail.applicantType == 20) {
            url = url + '&id=' + this.data.baoxiaoDetail.applicantId
        }
        if(auxptyid == 4 && this.data.baoxiaoDetail.applicantType == 30) {
            url = url + '&id=' + this.data.baoxiaoDetail.applicantId
        }
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + url,
            method: 'GET',
            success: res => {
                const name = this.getAuxptyNameMap(auxptyid)
                console.log(res.data.rows, 'res.data.rows')
                const newObj = res.data.rows.map(item => {
                    return {
                        id: item.id,
                        name: item[name],
                        auxptyId: auxptyid
                    }
                })
                const tempData = clone(this.data.baoxiaoDetail.allAuxptyList)
                tempData[auxptyid] = newObj
                console.log(tempData)
                this.setData({
                    baoxiaoDetail: {
                        ...this.data.baoxiaoDetail,
                        allAuxptyList: tempData
                    }
                })
                if(flag) {
                    // 设置默认值
                    let index = null
                    if (auxptyid == 1) {
                        // 部门
                        let submitterDepartmentId = ''
                        if(this.data.baoxiaoDetail.selectedAuxpty && this.data.baoxiaoDetail.selectedAuxpty[auxptyid]) {
                            submitterDepartmentId = this.data.baoxiaoDetail.selectedAuxpty[auxptyid].id
                        }else{
                            submitterDepartmentId = this.data.baoxiaoDetail.submitterDepartmentId
                        }
                        index = this.setInitIndex(newObj, submitterDepartmentId)
                    }
                    if (auxptyid == 2 && this.data.baoxiaoDetail.applicantType == 10) {
                        index = this.setInitIndex(newObj, this.data.baoxiaoDetail.applicantId)
                    }
                    if (auxptyid == 3 && this.data.baoxiaoDetail.applicantType == 20) {
                        index = this.setInitIndex(newObj, this.data.baoxiaoDetail.applicantId)
                    }
                    if (auxptyid == 4 && this.data.baoxiaoDetail.applicantType == 30) {
                        index = this.setInitIndex(newObj, this.data.baoxiaoDetail.applicantId)
                    }
                    if (index !== null) {
                        this.setSelectedAuxpty(newObj[index])
                    }
                }
            }
        })
    },
    setSelectedAuxpty(auxpty) {
        this.setData({
            baoxiaoDetail: {
                ...this.data.baoxiaoDetail,
                selectedAuxpty: {
                    ...this.data.baoxiaoDetail.selectedAuxpty,
                    [auxpty.auxptyId]: {
                        id: auxpty.id,
                        name: auxpty.name,
                        auxptyId: auxpty.auxptyId
                    }
                }
            }
        })
        const obj = Object.values(this.data.baoxiaoDetail.selectedAuxpty).map(item => {
            return {
                auxptyId: item.auxptyId,
                auxptyDetailId: item.id
            }
        })
        this.setData({
            baoxiaoDetail: {
                ...this.data.baoxiaoDetail,
                billDetailApEntityListObj: obj
            }
        })
    },
    setInitIndex(newObj, id) {
        let initIndex = 0
        newObj.forEach((item, index) => {
            if (item.id === id) {
                initIndex = index
            }
        })
        return initIndex
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
        if (app.globalData.loadingCount === 0) {
            wx.hideLoading()
        }
    },
    submitBaoxiaoDetail() {
        const validSuccess = this.valid(this.data.baoxiaoDetail)
        if(validSuccess) {
            this.setData({
                baoxiaoArr: this.data.baoxiaoArr.concat(this.data.baoxiaoDetail)
            })
            const tempData = clone(this.data.baoxiaoArr)
            tempData.forEach(item => {
                item.trueSubjectId = item.subjectId
                item.billDetailTrueApEntityListObj = clone(item.billDetailApEntityListObj)
            })
            this.addLoading()
            wx.setStorage({
                key: 'newBaoxiaoDetailArr',
                data: tempData,
                success: res => {
                    this.hideLoading()
                    wx.navigateBack({
                        delta: 1
                    })
                }
            })
        }
    },
    addDetail() {
        const validSuccess = this.valid(this.data.baoxiaoDetail)
        if (validSuccess) {
            this.setData({
                baoxiaoArr: this.data.baoxiaoArr.concat(this.data.baoxiaoDetail)
            })
            this.setData({
                baoxiaoDetail: wx.getStorageSync('initBaoxiaoDetail')
            })
        }
    },
    openExtraInfo(e) {
        var extraId = e.currentTarget.dataset.extraid
        if (this.data.baoxiaoDetail.subjectExtraId) {
            this.getExtraInfo(extraId)
        }
    },
    getExtraInfo(extraId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'reimbursementBillExtraController.do?getDetail&subjectExtraId=' + extraId,
            method: 'GET',
            success: res => {
                console.log(res, '附加信息............')
                if (res.data.success) {
                    this.setData({
                        subjectExtraConf: JSON.parse(res.data.obj),
                    })
                    // 回显
                    var tempData = clone(this.data.baoxiaoDetail)
                    if (!tempData.extraMessage) {
                        tempData.extraMessage = []
                        tempData.extraList = []
                        this.setData({
                            baoxiaoDetail: tempData
                        })
                    }
                    wx.setStorage({
                        key: 'subjectExtraConf',
                        data: JSON.parse(res.data.obj),
                        success: res => {
                            wx.setStorageSync('extraBaoxiaoDetail', this.data.baoxiaoDetail)
                            wx.navigateTo({
                                url: '/pages/extra/index'
                            })
                        }
                    })
                }
            }
        })
    },
    goSubjectPage() {
        wx.navigateTo({
            url: '/pages/subjectPage/index'
        })
    },
    goAuxptyPage(e) {
        const auxptyId = e.currentTarget.dataset.id
        console.log(auxptyId, 'auxptyId,......')
        wx.setStorage({
            key: 'auxptyList',
            data: this.data.baoxiaoDetail.allAuxptyList[auxptyId],
            success: res => {
                wx.navigateTo({
                    url: '/pages/auxptyPage/index'
                })
            }
        })
    },
    valid(obj) {
        console.log(obj, '..........')
        if (!obj.subjectId) {
            validFn('请选择费用类型')
            return false
        }
        if (Number(obj.applicationAmount) <= 0) {
            validFn('申请报销金额为空')
            return false
        }
        if (!obj.taxRate && obj.invoiceType == 2) {
            validFn('请选择税率')
            return false
        }
        return true
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
