import '../../util/handleLodash'
import {cloneDeep as clone} from "lodash";
import {formatNumber, validFn, request} from "../../util/getErrorMessage";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        kaipiaoDetail: {},
        kaipiaoArr: [],
        remarks: [],
        remarkIndex: 0
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })

        const isEdit = wx.getStorageSync('edit')
        const initKaipiaoDetail = wx.getStorageSync('initKaipiaoDetail')
        const kaipiaoDetail = wx.getStorageSync('kaipiaoDetail')
        if (!kaipiaoDetail) {
            this.setData({
                kaipiaoDetail: initKaipiaoDetail
            })
        } else {
            if (isEdit) {
                this.getSubjectAuxptyList(kaipiaoDetail.subjectId, kaipiaoDetail.accountbookId, false)
                wx.removeStorage({
                    key: 'edit',
                    success: res => {
                        console.log('清除isEdit成功')
                    }
                })
            }
            this.setData({
                kaipiaoDetail: kaipiaoDetail
            })
        }
        // 获取开票内容
        this.getRemarksFromStorage()
        // 设置remarkIndex的值
        this.data.remarks.forEach((item, index) => {
            if(item.remark === this.data.kaipiaoDetail.remark) {
                this.setData({
                    remarkIndex: index,
                    kaipiaoDetail: {
                        ...this.data.kaipiaoDetail,
                        remarkIndex: index
                    }
                })
            }
        })
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
                kaipiaoDetail: {
                    ...this.data.kaipiaoDetail,
                    selectedAuxpty: null,
                    subjectId: subject.id,
                    subjectName: subject.name,
                    billDetailTrueApEntityListObj: [],
                    billDetailApEntityListObj: [],
                    applicationAmount: '',
                }
            })
            wx.removeStorage({
                key: 'subject'
            })
            this.getSubjectAuxptyList(subject.id, this.data.kaipiaoDetail.accountbookId, true)
        }
    },
    getRemarksFromStorage(){
        const remarks = wx.getStorageSync('remarks')
        if(!!remarks && remarks.length) {
            this.setData({
                remarks,
            })
        }
    },
    bindObjPickerChange(e) {
        const index = e.detail.value
        if(this.data.remarks[index].id !== '') {
            this.setData({
                remarkIndex: index,
                kaipiaoDetail: {
                    ...this.data.kaipiaoDetail,
                    remark: this.data.remarks[e.detail.value].remark,
                    remarkIndex: index
                }
            })
        }
    },
    onShow() {
        setTimeout(() => {
            this.getAuxptyIdFromStorage()
            this.getSubjectIdFromStorage()
        }, 300)
        let kaipiaoDetail = wx.getStorageSync('kaipiaoDetail')
        if (!!kaipiaoDetail) {
            kaipiaoDetail.formatUnverifyAmount = formatNumber(Number(this.data.kaipiaoDetail.unverifyAmount).toFixed(2))
            this.setData({
                kaipiaoDetail
            })
        }

        wx.removeStorage({
            key: 'kaipiaoDetail',
            success: res => {
                console.log('清除编辑详情数据成功...')
            }
        })
    },
    onKaipiaoBlur(e) {
        var tempData = clone(this.data.kaipiaoDetail)
        var name = e.currentTarget.dataset.name
        tempData[name] = e.detail.value
        if (name === 'applicationAmount') {
            tempData['formatApplicationAmount'] = formatNumber(Number(e.detail.value).toFixed(2))
        }
        this.setData({
            kaipiaoDetail: tempData,
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
                        kaipiaoDetail: {
                            ...this.data.kaipiaoDetail,
                            subjectAuxptyList: arr
                        }
                    })
                    arr.forEach(item => {
                        this.getAuxptyList(accountbookId, item.auxptyId, flag)
                    })
                } else {
                    this.setData({
                        kaipiaoDetail: {
                            ...this.data.kaipiaoDetail,
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
        this.addLoading()
        let url = this.getAuxptyUrl(accountbookId, auxptyid)
        if(auxptyid == 2 && this.data.kaipiaoDetail.applicantType == 10) {
            url = url + '&id=' + this.data.kaipiaoDetail.applicantId
        }
        if(auxptyid == 3 && this.data.kaipiaoDetail.applicantType == 20) {
            url = url + '&id=' + this.data.kaipiaoDetail.applicantId
        }
        if(auxptyid == 4 && this.data.kaipiaoDetail.applicantType == 30) {
            url = url + '&id=' + this.data.kaipiaoDetail.applicantId
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
                const tempData = clone(this.data.kaipiaoDetail.allAuxptyList)
                tempData[auxptyid] = newObj
                this.setData({
                    kaipiaoDetail: {
                        ...this.data.kaipiaoDetail,
                        allAuxptyList: tempData
                    }
                })
                if(flag) {
                    // 设置默认值
                    let index = null
                    if (auxptyid == 1) {
                        // 部门
                        // 部门
                        let submitterDepartmentId = ''
                        if(this.data.kaipiaoDetail.selectedAuxpty && this.data.kaipiaoDetail.selectedAuxpty[auxptyid]) {
                            submitterDepartmentId = this.data.kaipiaoDetail.selectedAuxpty[auxptyid].id
                        }else{
                            submitterDepartmentId = this.data.kaipiaoDetail.submitterDepartmentId
                        }
                        index = this.setInitIndex(newObj, submitterDepartmentId)
                    }
                    if (auxptyid == 2 && this.data.kaipiaoDetail.applicantType == 10) {
                        index = this.setInitIndex(newObj, this.data.kaipiaoDetail.applicantId)
                    }
                    if (auxptyid == 3 && this.data.kaipiaoDetail.applicantType == 20) {
                        index = this.setInitIndex(newObj, this.data.kaipiaoDetail.applicantId)
                    }
                    if (auxptyid == 4 && this.data.kaipiaoDetail.applicantType == 30) {
                        index = this.setInitIndex(newObj, this.data.kaipiaoDetail.applicantId)
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
            kaipiaoDetail: {
                ...this.data.kaipiaoDetail,
                selectedAuxpty: {
                    ...this.data.kaipiaoDetail.selectedAuxpty,
                    [auxpty.auxptyId]: {
                        id: auxpty.id,
                        name: auxpty.name,
                        auxptyId: auxpty.auxptyId
                    }
                }
            }
        })
        const obj = Object.values(this.data.kaipiaoDetail.selectedAuxpty).map(item => {
            return {
                auxptyId: item.auxptyId,
                auxptyDetailId: item.id
            }
        })
        this.setData({
            kaipiaoDetail: {
                ...this.data.kaipiaoDetail,
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
        if (app.globalData.loadingCount <= 0) {
            wx.hideLoading()
        }
    },
    submitKaipiaoDetail() {
        if(Number(this.data.kaipiaoDetail.applicationAmount) > Number(this.data.kaipiaoDetail.unverifyAmount)) {
            wx.showModal({
                content: '开票金额不能大于可申请余额',
                confirmText: '好的',
                showCancel: false,
            })
            return
        }
        const validSuccess = this.valid(this.data.kaipiaoDetail)
        if(validSuccess) {
            this.setData({
                kaipiaoArr: this.data.kaipiaoArr.concat(this.data.kaipiaoDetail)
            })
            const tempData = clone(this.data.kaipiaoArr)
            tempData.forEach(item => {
                item.trueSubjectId = item.subjectId
                item.billDetailTrueApEntityListObj = clone(item.billDetailApEntityListObj)
                item.formatApplicationAmount = formatNumber(Number(item.applicationAmount).toFixed(2))
            })
            this.addLoading()
            wx.setStorage({
                key: 'newKaipiaoDetailArr',
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
        const subjectList = wx.getStorageSync('subjectList')
        if(!subjectList || !subjectList.length) {
            wx.showModal({
                content: '暂无销售类型',
                confirmText: '好的',
                showCancel: false,
                success: () => {}
            })
            return
        }
        const validSuccess = this.valid(this.data.kaipiaoDetail)
        if (validSuccess) {
            this.setData({
                kaipiaoArr: this.data.kaipiaoArr.concat(this.data.kaipiaoDetail)
            })
            this.setData({
                kaipiaoDetail: wx.getStorageSync('initKaipiaoDetail'),
                remarkIndex: 0
            })
        }
    },
    goSubjectPage() {
        if(!this.data.kaipiaoDetail.billId) {
            wx.navigateTo({
                url: '/pages/subjectPage/index'
            })
        }else{
            wx.showModal({
                content: '导入的单据此处不可编辑',
                confirmText: '好的',
                showCancel: false,
            })
        }
    },
    goAuxptyPage(e) {
        if(!this.data.kaipiaoDetail.billId) {
            const auxptyId = e.currentTarget.dataset.id
            wx.setStorage({
                key: 'auxptyList',
                data: this.data.kaipiaoDetail.allAuxptyList[auxptyId],
                success: res => {
                    wx.navigateTo({
                        url: '/pages/auxptyPage/index'
                    })
                }
            })
        }else{
            wx.showModal({
                content: '导入的单据此处不可编辑',
                confirmText: '好的',
                showCancel: false,
            })
        }
    },
    valid(obj) {
        if (!obj.subjectId) {
            validFn('请选择费用类型')
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
