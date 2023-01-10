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
            remark: '',
            formatNumber: '',
            formatPrice: '',
            formatDiscountRate: '',
            formatDiscountAmount: '',
            formatAmount: '',
            formatUntaxedAmount: '',
            formatTaxAmount: ''
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
            purchaseOrderDetail: {
                ...this.data.purchaseOrderDetail,
                unitId: unitList[0].unitId
            }
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
        const name = e.currentTarget.dataset.name
        this.calculateAmount(name, e.detail.value.replace(/,/g, ''))
    },
    calculateAmount(name, value) {
        this.setData({
            purchaseOrderDetail: {
                ...this.data.purchaseOrderDetail,
                [name]: value
            }
        })
        // 计算================================
        // 含税单价*计价数量，填列数量和含税单价时自动带出，含税单价*计价数量≠价税合计时不可提交								
        // 含税单价*计价数量，填列数量和含税单价时自动带出，含税单价*计价数量≠价税合计时不可提交																
        //折扣额=计价数量*含税单价*(1-折扣率/100)
        // 折扣率=(1-折扣额/计价数量/含税单价)*100
        // ===================================
        if (name === 'number') {
            const price = this.data.purchaseOrderDetail.price || 0
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    [name]: value,
                    formatNumber: formatNumber(Number(value).toFixed(2)),
                    amount: price ? (Number(price) * Number(value)).toString() : 0,
                    formatAmount: formatNumber((Number(price) * Number(value)).toFixed(2))
                }
            })
        }
        if (name === 'price') {
            const number = this.data.purchaseOrderDetail.number || 0
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    [name]: value,
                    formatPrice: formatNumber(Number(value).toFixed(2)),
                    amount: number ? (Number(number) * Number(value)).toString() : 0,
                    formatAmount: formatNumber((Number(number) * Number(value)).toFixed(2))
                }
            })
        }
        if (name === 'amount') {
            const number = this.data.purchaseOrderDetail.number || 1
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    [name]: value,
                    formatAmount: formatNumber(Number(value).toFixed(2)),
                    price: (Number(value) / Number(number)).toString(),
                    formatPrice: formatNumber((Number(value) / Number(number)).toFixed(2)),
                }
            })
            if (this.data.purchaseOrderDetail.invoiceType == 2) {
                // 算一下税额
                if (this.data.purchaseOrderDetail.taxRate) {
                    this.calculateTaxAmount(this.data.purchaseOrderDetail.taxRate)
                }
            }else{
                this.setData({
                    purchaseOrderDetail: {
                        ...this.data.purchaseOrderDetail,
                        untaxedAmount: value,
                        formatUntaxedAmount: formatNumber(Number(value))
                    }
                })
            }
        }
        if (this.data.purchaseOrderDetail.invoiceType == 1) {
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    taxRate: '',
                    taxAmount: '',
                    formatTaxAmount: '',
                    untaxedAmount: this.data.purchaseOrderDetail.amount,
                    formatUntaxedAmount: this.data.purchaseOrderDetail.formatAmount
                }
            })
        }
        if (name === 'taxAmount') {
            const amount = this.data.purchaseOrderDetail.amount || 0
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    [name]: value,
                    formatTaxAmount: formatNumber(Number(value).toFixed(2)),
                    untaxedAmount: (Number(amount) - Number(value)).toString(),
                    formatUntaxedAmount: formatNumber((Number(amount) - Number(value)).toFixed(2))
                }
            })
        }
        if (name === 'untaxedAmount') {
            const amount = this.data.purchaseOrderDetail.amount || 0
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    [name]: value,
                    formatUntaxedAmount: formatNumber(Number(value).toFixed(2)),
                    taxAmount: (Number(amount) - Number(value)).toString(),
                    formatTaxAmount: formatNumber((Number(amount) - Number(value)).toFixed(2))
                }
            })
        }
        // 折扣率 折扣额
        //折扣额=计价数量*含税单价*(1-折扣率/100)
        // 折扣率=(1-折扣额/计价数量/含税单价)*100
        if (name === 'discountRate') {
            const { number, price } = this.data.purchaseOrderDetail
            if (!number || !price) {
                wx.showModal({
                    title: '请填写数量或者单价'
                })
                return
            }
            const discountAmount = Number(number) * Number(price) * (1 - Number(value) / 100)
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    [name]: value,
                    formatDiscountRate: formatNumber(Number(value).toFixed(2)),
                    discountAmount,
                    formatDiscountAmount: formatNumber(discountAmount.toFixed(2))
                }
            })
        }
        if (name === 'discountAmount') {
            const { number, price } = this.data.purchaseOrderDetail
            if (!number || !price) {
                wx.showModal({
                    title: '请填写数量或者单价'
                })
                return
            }
            const discountRate = (1 - Number(value) / Number(number) / Number(price)) * 100
            this.setData({
                purchaseOrderDetail: {
                    ...this.data.purchaseOrderDetail,
                    [name]: value,
                    formatDiscountAmount: formatNumber(Number(value).toFixed(2)),
                    discountRate,
                    formatDiscountRate: formatNumber(discountRate.toFixed(2))
                }
            })
        }
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
            purchaseOrderItem.taxAmount = ''
            purchaseOrderItem.formatTaxedAmount = ''
            purchaseOrderItem.untaxedAmount = purchaseOrderItem.amount
            purchaseOrderItem.formatUntaxedAmount = purchaseOrderItem.formatAmount
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
        // 算一下税额
        this.calculateTaxAmount(purchaseOrderItem.taxRate)
    },
    calculateTaxAmount(taxRate) {
        // 未税金额=价税合计/(1+税率/100)
        const amount = this.data.purchaseOrderDetail.amount || 0
        const untaxedAmount = (Number(amount) / (1 + Number(taxRate) / 100)).toString()
        this.setData({
            purchaseOrderDetail: {
                ...this.data.purchaseOrderDetail,
                untaxedAmount,
                formatUntaxedAmount: formatNumber(Number(untaxedAmount).toFixed(2)),
                taxAmount: Number(amount) - Number(untaxedAmount),
                formatTaxAmount: formatNumber((Number(amount) - Number(untaxedAmount)).toFixed(2))
            }
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
        const validSuccess = this.valid(this.data.purchaseOrderDetail)
        if (validSuccess) {
            this.setData({
                purchaseOrderDetailArr: this.data.purchaseOrderDetailArr.concat(this.data.purchaseOrderDetail)
            })
            this.addLoading()
            wx.setStorage({
                key: 'newPurchaseOrderDetailArr',
                data: this.data.purchaseOrderDetailArr,
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
        if (!obj.goodsName) {
            validFn('请选择商品')
            return
        }
        if (!obj.number) {
            validFn('请输入计价数量')
            return
        }
        if (!obj.price) {
            validFn('请输入含税单价')
            return
        }
        if (!obj.amount) {
            validFn('请输入价税合计')
            return
        }
        if (!obj.untaxedAmount) {
            validFn('请输入未税金额')
            return
        }
        if (obj.invoiceType == 2) {
            if (!obj.taxRate) {
                validFn('请选择税率')
                return
            }
            if (!obj.taxAmount) {
                validFn('请输入税额')
                return
            }
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
