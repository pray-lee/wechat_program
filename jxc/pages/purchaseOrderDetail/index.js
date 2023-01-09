import '../../../util/handleLodash'
import { cloneDeep as clone } from 'lodash'
import { formatNumber, validFn, request } from "../../../util/getErrorMessage";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        noticeHidden: true,
        purchaseOrderDetail: {
            goodsName: '',
            goodsCode: '',
            goodsSpecs: '',
            auxiliaryAttributeName: '',
            unitId: '',
            warehouseId: '',
            number: '',
            price: '',
            discountRate: '',
            discountAmount: '',
            amount: '',
            invoiceType: 1,
            taxRate: '',
            taxAmount: '',
            untaxedAmount: '',
            remark: ''
        },
        purchaseOrderDetailArr: [],
        // 单位
        unitList: [],
        unitIndex: 0,
        // 仓库
        warehouseList: [],
        warehouseIndex: 0,
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        const isEdit = wx.getStorageSync('edit')
        const initPurchaseOrderDetail = wx.getStorageSync('initPurchaseOrderDetail')
        const purchaseOrderDetail = wx.getStorageSync('purchaseOrderDetail')
        if (!purchaseOrderDetail) {
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    ...initPurchaseOrderDetail
                }
            })
        } else {
            if (isEdit) {
                wx.removeStorage({
                    key: 'edit',
                    success: res => {
                        console.log('清除isEdit成功')
                    }
                })
            }
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    ...purchaseOrderDetail
                },
            })
        }
    },
    handleUnit(goodsUnitName) {
        const unitList = goodsUnitName.split('##').map(unit => {
            const unitInfo = unit.split('@@')
            return {
                unitId: unitInfo[0],
                unitName: unitInfo[1]
            }
        })
        this.setData({
            unitList,
        })
    },
    // 获取仓库信息
    getWarehouseListFromStorage() {
        const warehouseList = wx.getStorageSync('warehouseList') || {}
        this.setData({
            warehouseList 
        })
    },
    getGoodsInfoFromStorage() {
        const goodsInfo = wx.getStorageSync('goodsInfo') || {}
        goodsInfo.goodsUnitName && this.handleUnit(goodsInfo.goodsUnitName)
        this.setData({
            purchaseOrderDetail: {
                ...this.data.purchaseOrderDetail,
                ...goodsInfo
            }
        })
        wx.removeStorage({
            key: 'goodsInfo',
            success: () => {
                console.log('清除商品详情成功...')
            }
        })
    },
    bindObjPickerChange(e) {
        var name = e.currentTarget.dataset.name
        var listName = e.currentTarget.dataset.list
        var value = e.detail.value
        var index = e.currentTarget.dataset.index
        this.setData({
            [index]: e.detail.value,
            purchaseOrderDetail: {
                ...this.data.purchaseOrderDetail,
                [name]: this.data[listName][value].unitId
            }
        })
    },
    onShow() {
        // 获取仓库信息
        this.getWarehouseListFromStorage()
        // 获取选择的商品详情
        this.getGoodsInfoFromStorage()
        // ========页面显示=======
        const purchaseOrderDetail = wx.getStorageSync('purchaseOrderDetail')
        if (!!purchaseOrderDetail) {
            this.setData({
                ...this.data.purchaseOrderDetail,
                ...app.purchaseOrderDetail,
            })
        }
        wx.removeStorage({
            key: 'purchaseOrderDetail',
            success: res => {
                console.log('清除编辑详情数据成功...')
            }
        })
    },
    gotoGoodsList() {
        wx.navigateTo({
            url: '/jxc/pages/goodsList/index'
        })
    },
    onPurchaseOrderBlur(e) {
        
    },
    purchaseOrderRadioChange(e) {
        var value = e.detail.value ? 2 : 1
        var purchaseOrderItem = clone(this.data.purchaseOrderDetail)
        purchaseOrderItem.invoiceType = value
        if (value == 2) {
            purchaseOrderItem.taxRageArr = purchaseOrderItem.taxRageObject.taxRageArr
            purchaseOrderItem.taxRageIndex = 0
            purchaseOrderItem.taxRate = purchaseOrderItem.taxRageObject.taxRageArr[0].id
            purchaseOrderItem.noticeHidden = false
            this.setData({
                purchaseOrderDetail: purchaseOrderItem,
                noticeHidden: false
            })
        } else {
            purchaseOrderItem.taxRageArr = []
            purchaseOrderItem.taxRageIndex = 0
            purchaseOrderItem.taxRate = ''
            purchaseOrderItem.noticeHidden = true
            this.setData({
                purchaseOrderDetail: purchaseOrderItem,
                noticeHidden: true
            })
        }
    },
    // 税率点击
    bindTaxRagePickerChange(e) {
        var purchaseOrderItem = clone(this.data.purchaseOrderDetail)
        var value = e.detail.value
        purchaseOrderItem.taxRageIndex = value
        purchaseOrderItem.taxRate = purchaseOrderItem.taxRageArr[value].id
        this.setData({
            purchaseOrderDetail: purchaseOrderItem
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
    submitPurchaseOrderDetail() {
        console.log(this.data.purchaseOrderDetail)
        return
        const validSuccess = this.valid(this.data.purchaseOrderDetail)
        if (validSuccess) {
            this.setData({
                purchaseOrderDetailArr: this.data.purchaseOrderDetailArr.concat(this.data.purchaseOrderDetail)
            })
            const tempData = clone(this.data.purchaseOrderDetailArr)
            tempData.forEach(item => {
                item.trueSubjectId = item.subjectId
                item.billDetailTrueApEntityListObj = clone(item.billDetailApEntityListObj)
            })
            this.addLoading()
            wx.setStorage({
                key: 'newPurchaseOrderDetailArr',
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
        const validSuccess = this.valid(this.data.purchaseOrderDetail)
        if (validSuccess) {
            this.setData({
                purchaseOrderDetailArr: this.data.purchaseOrderDetailArr.concat(this.data.purchaseOrderDetail)
            })
            this.setData({
                purchaseOrderDetail: wx.getStorageSync('initPurchaseOrderDetail')
            })
        }
    },
    valid(obj) {
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
    },
    /**
     *
     * @param 上传图片字符串列表
     */
    uploadFile(array, accountbookId) {
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
                            accountbookId,
                            submitterDepartmentId: 'department-invoice'
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
                    billFilesList.push({
                        name: item.name,
                        uri: item.uri,
                        size: item.size
                    })
                })
                this.doOCR(billFilesList, accountbookId)
            }).catch(error => {
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
})
