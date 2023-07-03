import '../../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {formatNumber, validFn, request} from "../../../util/getErrorMessage";
import NP from "number-precision";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        noticeHidden: true,
        purchaseWarehouseOrderDetail: {
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
            originAmount: '',
            invoiceType: 1,
            taxRate: '',
            taxAmount: '',
            untaxedAmount: '',
            originUntaxedAmount: '',
            remark: '',
            formatNumber: '',
            formatPrice: '',
            formatDiscountRate: '',
            formatDiscountAmount: '',
            formatAmount: '',
            formatUntaxedAmount: '',
            formatTaxAmount: ''
        },
        purchaseWarehouseOrderDetailArr: [],
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
        const initPurchaseWarehouseOrderDetail = wx.getStorageSync('initPurchaseWarehouseOrderDetail')
        const purchaseWarehouseOrderDetail = wx.getStorageSync('purchaseWarehouseOrderDetail')
        if (!purchaseWarehouseOrderDetail) {
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    ...initPurchaseWarehouseOrderDetail
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
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    ...purchaseWarehouseOrderDetail,
                    formatNumber: formatNumber(Number(purchaseWarehouseOrderDetail.number).toFixed(2)) || '',
                    formatPrice: formatNumber(Number(purchaseWarehouseOrderDetail.price).toFixed(2)) || '',
                    discountRate: purchaseWarehouseOrderDetail.discountRate ? Number(purchaseWarehouseOrderDetail.discountRate).toFixed(2) : '',
                    formatDiscountAmount: purchaseWarehouseOrderDetail.discountAmount ? formatNumber(Number(purchaseWarehouseOrderDetail.discountAmount).toFixed(2)) : '',
                    formatOriginAmount: formatNumber(Number(purchaseWarehouseOrderDetail.originAmount).toFixed(2)) || '',
                    formatAmount: formatNumber(Number(purchaseWarehouseOrderDetail.amount).toFixed(2)) || '',
                    formatTaxAmount: formatNumber(Number(purchaseWarehouseOrderDetail.taxAmount).toFixed(2)) || '',
                    formatUntaxedAmount: formatNumber(Number(purchaseWarehouseOrderDetail.originUntaxedAmount).toFixed(2)) || '',
                },
            })
        }
        // 设置编辑时候的税率
        this.setInitTaxRate(this.data.purchaseWarehouseOrderDetail)
    },
    setInitTaxRate(purchaseWarehouseOrderDetail) {
        let {taxRageArr} = purchaseWarehouseOrderDetail.taxRageObject
        let taxRageIndex = 0
        const taxRate = purchaseWarehouseOrderDetail.taxRate
        taxRageArr.forEach((item, index) => {
            if (taxRate == item.id) {
                taxRageIndex = index
            }
        })
        this.setData({
            purchaseWarehouseOrderDetail: {
                ...this.data.purchaseWarehouseOrderDetail,
                taxRageIndex,
                taxRageArr,
                taxRate
            }
        })
    },
    // 获取仓库信息
    getWarehouseListFromStorage() {
        const warehouseList = wx.getStorageSync('warehouseList') || []
        let warehouseIndex = 0
        if (this.data.purchaseWarehouseOrderDetail.warehouseId) {
            warehouseList.forEach((item, index) => {
                if (item.warehouseId === this.data.purchaseWarehouseOrderDetail.warehouseId) {
                    warehouseIndex = index
                }
            })
        }
        this.setData({
            warehouseList,
            warehouseIndex,
            purchaseWarehouseOrderDetail: {
                ...this.data.purchaseWarehouseOrderDetail,
                warehouseId: warehouseList[warehouseIndex].warehouseId
            }
        })
    },
    // 获取计量单位
    getUnitList(id) {
        if (id) {
            this.addLoading()
            request({
                hideLoading: this.hideLoading(),
                url: `${app.globalData.url}unitController.do?getUnitListById&unitId=${id}`,
                method: 'GET',
                success: res => {
                    const unitList = res.data.map(item => ({unitId: item.id, unitName: item.unitName}))
                    let unitIndex = 0
                    unitList.forEach((item, index) => {
                        if (item.unitId === id) {
                            unitIndex = index
                        }
                    })
                    this.setData({
                        unitList,
                        unitIndex,
                        purchaseWarehouseOrderDetail: {
                            ...this.data.purchaseWarehouseOrderDetail,
                            unitId: id
                        }
                    })
                }
            })
        } else {
            this.setData({
                unitList: [],
                unitIndex: 0
            })
        }
    },
    getGoodsInfoFromStorage() {
        const goodsInfo = wx.getStorageSync('goodsInfo') || {}
        this.getUnitList(goodsInfo.goodsUnit || this.data.purchaseWarehouseOrderDetail.goodsUnit || this.data.purchaseWarehouseOrderDetail.unitId)
        this.setData({
            purchaseWarehouseOrderDetail: {
                ...this.data.purchaseWarehouseOrderDetail,
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
        if (name === 'unitId') {
            this.setData({
                [index]: e.detail.value,
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: this.data[listName][value].unitId
                }
            })
        }
        if (name === 'warehouseId') {
            this.setData({
                [index]: e.detail.value,
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: this.data[listName][value].warehouseId
                }
            })
        }
    },
    onShow() {
        // 获取仓库信息
        this.getWarehouseListFromStorage()
        // 获取选择的商品详情
        this.getGoodsInfoFromStorage()
        // 获取计量单位
        this.getUnitList()
        // ========页面显示=======
        const purchaseWarehouseOrderDetail = wx.getStorageSync('purchaseWarehouseOrderDetail')
        if (!!purchaseWarehouseOrderDetail) {
            this.setData({
                ...this.data.purchaseWarehouseOrderDetail,
                ...purchaseWarehouseOrderDetail,
            })
        }
        wx.removeStorage({
            key: 'purchaseWarehouseOrderDetail',
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
    onPurchaseWarehouseOrderBlur(e) {
        const name = e.currentTarget.dataset.name
        this.calculateAmount(name, e.detail.value.replace(/,/g, ''))
    },
    calculateAmount(name, value) {
        // 计算================================
        // 含税单价*计价数量，填列数量和含税单价时自动带出，含税单价*计价数量≠价税合计时不可提交
        // 含税单价*计价数量，填列数量和含税单价时自动带出，含税单价*计价数量≠价税合计时不可提交
        //折扣额=计价数量*含税单价*(1-折扣率/100)
        // 折扣率=(1-折扣额/计价数量/含税单价)*100
        // ===================================
        // 数量 * 单价 - 折扣额 = 未税金额 + 税额
        if (name === 'number') {
            const {orderDetailId, number} = this.data.purchaseWarehouseOrderDetail
            if(orderDetailId && Number(number) < Number(value)) {
                validFn('入库单计价数量不能大于导入的采购订单计价数量')
                return
            }
            const price = this.data.purchaseWarehouseOrderDetail.price || 0
            const discountAmount = this.data.purchaseWarehouseOrderDetail.discountAmount || 0
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: value,
                    formatNumber: value ? formatNumber(Number(value).toFixed(2)) : '',
                    amount: price ? NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toString() : '',
                    formatAmount: price ? formatNumber(NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toFixed(2)) : '',
                    originAmount: price ? NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toString() : '',
                    formatOriginAmount: price ? formatNumber(NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toFixed(2)) : '',
                }
            })
            if (this.data.purchaseWarehouseOrderDetail.invoiceType == 2) {
                // 算一下税额
                this.calculateTaxAmount(this.data.purchaseWarehouseOrderDetail.taxRate)
            } else {
                this.setData({
                    purchaseWarehouseOrderDetail: {
                        ...this.data.purchaseWarehouseOrderDetail,
                        untaxedAmount: price ? NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toString() : '',
                        formatUntaxedAmount: price ? formatNumber(NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toFixed(2)) : '',
                        originUntaxedAmount: price ? NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toString() : '',
                        formatUntaxedAmount: price ? formatNumber(NP.minus(NP.times(Number(price), Number(value)), Number(discountAmount)).toFixed(2)) : '',
                    }
                })
            }
        } else if (name === 'price') {
            const number = this.data.purchaseWarehouseOrderDetail.number || 0
            const discountAmount = this.data.purchaseWarehouseOrderDetail.discountAmount || 0
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: value,
                    formatPrice: value ? formatNumber(Number(value).toFixed(2)) : '',
                    amount: number ? NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount)).toString() : '',
                    formatAmount: number ? formatNumber(Number(NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount))).toFixed(2)) : '',
                    originAmount: number ? NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount)).toString() : '',
                    formatOriginAmount: number ? formatNumber(Number(NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount))).toFixed(2)) : '',
                }
            })
            if (this.data.purchaseWarehouseOrderDetail.invoiceType == 2) {
                // 算一下税额
                this.calculateTaxAmount(this.data.purchaseWarehouseOrderDetail.taxRate)
            } else {
                this.setData({
                    purchaseWarehouseOrderDetail: {
                        ...this.data.purchaseWarehouseOrderDetail,
                        untaxedAmount: number ? NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount)).toString() : '',
                        originUntaxedAmount: number ? NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount)).toString() : '',
                        formatUntaxedAmount: number ? formatNumber(Number(number ? NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount)).toString() : 0).toFixed(2)) : '',
                        formatOriginUntaxedAmount: number ? formatNumber(Number(number ? NP.minus(NP.times(Number(number), Number(value)), Number(discountAmount)).toString() : 0).toFixed(2)) : '',
                    }
                })
            }
        } else if (name === 'amount') {
            const number = this.data.purchaseWarehouseOrderDetail.number || 1
            const discountAmount = this.data.purchaseWarehouseOrderDetail.discountAmount || 0
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: value,
                    formatAmount: formatNumber(Number(value).toFixed(2)),
                    originAmount: value,
                    formatOriginAmount: formatNumber(Number(value).toFixed(2)),
                    price: NP.divide(NP.minus(Number(value), Number(discountAmount)), Number(number)).toString(),
                    formatPrice: formatNumber(NP.divide(NP.minus(Number(value), Number(discountAmount)), Number(number)).toFixed(2)),
                }
            })
            if (this.data.purchaseWarehouseOrderDetail.invoiceType == 2) {
                // 算一下税额
                this.calculateTaxAmount(this.data.purchaseWarehouseOrderDetail.taxRate)
            } else {
                this.setData({
                    purchaseWarehouseOrderDetail: {
                        ...this.data.purchaseWarehouseOrderDetail,
                        taxRate: '',
                        taxAmount: '',
                        formatTaxAmount: '',
                        untaxedAmount: value,
                        originUntaxedAmount: value,
                        formatUntaxedAmount: formatNumber(Number(value)),
                        formatOriginUntaxedAmount: formatNumber(Number(value))
                    }
                })
            }
        } else if (name === 'taxAmount') {
            const amount = this.data.purchaseWarehouseOrderDetail.amount || 0
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: value,
                    formatTaxAmount: formatNumber(Number(value).toFixed(2)),
                    untaxedAmount: (Number(amount) - Number(value)).toString(),
                    originUntaxedAmount: (Number(amount) - Number(value)).toString(),
                    formatUntaxedAmount: formatNumber((Number(amount) - Number(value)).toFixed(2)),
                    formatOriginUntaxedAmount: formatNumber((Number(amount) - Number(value)).toFixed(2))
                }
            })
        } else if (name === 'untaxedAmount') {
            const amount = this.data.purchaseWarehouseOrderDetail.amount || 0
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: value,
                    originUntaxedAmount: value,
                    formatUntaxedAmount: formatNumber(Number(value).toFixed(2)),
                    formatOriginUntaxedAmount: formatNumber(Number(value).toFixed(2)),
                    taxAmount: (Number(amount) - Number(value)).toString(),
                    formatTaxAmount: formatNumber((Number(amount) - Number(value)).toFixed(2))
                }
            })
        } else if (name === 'discountRate') {
            // 折扣率 折扣额
            //折扣额=计价数量*含税单价*(1-折扣率/100)
            // 折扣率=(1-折扣额/计价数量/含税单价)*100
            if (value != 0 && (Number(value) === Number(this.data.purchaseWarehouseOrderDetail.discountRate))) {
                return
            }
            const {number, price} = this.data.purchaseWarehouseOrderDetail
            let discountAmount;
            if (value === '') {
                discountAmount = ''
            } else {
                discountAmount = NP.times(Number(number), Number(price), NP.minus(1, NP.divide(Number(value), 100)))
            }
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: value ? value : '',
                    formatDiscountRate: value ? formatNumber(Number(value).toFixed(2)) : '',
                    discountAmount,
                    formatDiscountAmount: discountAmount ? formatNumber(Number(discountAmount).toFixed(2)) : '',
                    amount: NP.minus(NP.times(price, number), Number(discountAmount)),
                    formatAmount: formatNumber(Number(NP.minus(NP.times(price, number), Number(discountAmount))).toFixed(2)),
                    originAmount: NP.minus(NP.times(price, number), Number(discountAmount)),
                    formatOriginAmount: formatNumber(Number(NP.minus(NP.times(price, number), Number(discountAmount))).toFixed(2)),
                }
            })
            if (this.data.purchaseWarehouseOrderDetail.invoiceType == 2) {
                // 算一下税额
                this.calculateTaxAmount(this.data.purchaseWarehouseOrderDetail.taxRate)
            } else {
                this.setData({
                    purchaseWarehouseOrderDetail: {
                        ...this.data.purchaseWarehouseOrderDetail,
                        taxRate: '',
                        taxAmount: '',
                        formatTaxAmount: '',
                        untaxedAmount: Number(NP.minus(NP.times(number, price), discountAmount)).toFixed(2),
                        formatUntaxedAmount: formatNumber(Number(NP.minus(NP.times(number, price), discountAmount)).toFixed(2)),
                        originUntaxedAmount: Number(NP.minus(NP.times(number, price), discountAmount)).toFixed(2),
                        formatOriginUntaxedAmount: formatNumber(Number(NP.minus(NP.times(number, price), discountAmount)).toFixed(2)),
                    }
                })
                console.log(this.data.purchaseWarehouseOrderDetail, 'detail')
            }
        } else if (name === 'discountAmount') {
            const {number, price} = this.data.purchaseWarehouseOrderDetail
            let discountRate;
            if (value === '') {
                discountRate = ''
            } else {
                discountRate = (NP.times(NP.minus(1, NP.divide(Number(value), Number(number), Number(price))), 100)).toFixed(2)
            }
            this.setData({
                purchaseWarehouseOrderDetail: {
                    ...this.data.purchaseWarehouseOrderDetail,
                    [name]: value ? value : '',
                    formatDiscountAmount: value ? formatNumber(Number(value).toFixed(2)) : '',
                    discountRate,
                    formatDiscountRate: discountRate ? formatNumber(Number(discountRate).toFixed(2)) : '',
                    amount: NP.minus(NP.times(price, number), Number(value)),
                    formatAmount: formatNumber(Number(NP.minus(NP.times(price, number))).toFixed(2)),
                    originAmount: NP.minus(NP.times(price, number), Number(value)),
                    formatOriginAmount: formatNumber(Number(NP.minus(NP.times(price, number), value)).toFixed(2)),
                }
            })
            if (this.data.purchaseWarehouseOrderDetail.invoiceType == 2) {
                // 算一下税额
                this.calculateTaxAmount(this.data.purchaseWarehouseOrderDetail.taxRate)
            } else {
                this.setData({
                    purchaseWarehouseOrderDetail: {
                        ...this.data.purchaseWarehouseOrderDetail,
                        taxRate: '',
                        taxAmount: '',
                        formatTaxAmount: '',
                        untaxedAmount: Number(NP.minus(NP.times(number, price), value)).toFixed(2),
                        formatUntaxedAmount: formatNumber(Number(NP.minus(NP.times(number, price), value)).toFixed(2)),
                        originUntaxedAmount: Number(NP.minus(NP.times(number, price), value)).toFixed(2),
                        formatOriginUntaxedAmount: formatNumber(Number(NP.minus(NP.times(number, price), value)).toFixed(2)),
                    }
                })
            }
        }
        this.setData({
            purchaseWarehouseOrderDetail: {
                ...this.data.purchaseWarehouseOrderDetail,
                [name]: value
            }
        })
    },
    purchaseWarehouseOrderRadioChange(e) {
        var value = e.detail.value ? 2 : 1
        var purchaseWarehouseOrderItem = clone(this.data.purchaseWarehouseOrderDetail)
        purchaseWarehouseOrderItem.invoiceType = value
        if (value == 2) {
            purchaseWarehouseOrderItem.taxRageArr = purchaseWarehouseOrderItem.taxRageObject.taxRageArr
            purchaseWarehouseOrderItem.taxRageIndex = 0
            purchaseWarehouseOrderItem.taxRate = purchaseWarehouseOrderItem.taxRageObject.taxRageArr[0].id
            purchaseWarehouseOrderItem.noticeHidden = false
            purchaseWarehouseOrderItem.taxAmount = ''
            purchaseWarehouseOrderItem.formatTaxAmount = ''
            this.setData({
                purchaseWarehouseOrderDetail: purchaseWarehouseOrderItem,
                noticeHidden: false
            })
        } else {
            purchaseWarehouseOrderItem.taxRageArr = []
            purchaseWarehouseOrderItem.taxRageIndex = 0
            purchaseWarehouseOrderItem.taxRate = ''
            purchaseWarehouseOrderItem.noticeHidden = true
            purchaseWarehouseOrderItem.taxAmount = ''
            purchaseWarehouseOrderItem.formatTaxAmount = ''
            purchaseWarehouseOrderItem.untaxedAmount = NP.minus(NP.times(purchaseWarehouseOrderItem.number, purchaseWarehouseOrderItem.price), purchaseWarehouseOrderItem.discountAmount)
            purchaseWarehouseOrderItem.formatUntaxedAmount = formatNumber(Number(NP.minus(NP.times(purchaseWarehouseOrderItem.number, purchaseWarehouseOrderItem.price), purchaseWarehouseOrderItem.discountAmount)).toFixed(2))
            purchaseWarehouseOrderItem.originUntaxedAmount = NP.minus(NP.times(purchaseWarehouseOrderItem.number, purchaseWarehouseOrderItem.price), purchaseWarehouseOrderItem.discountAmount)
            purchaseWarehouseOrderItem.formatOriginUntaxedAmount = formatNumber(Number(NP.minus(NP.times(purchaseWarehouseOrderItem.number, purchaseWarehouseOrderItem.price), purchaseWarehouseOrderItem.discountAmount)).toFixed(2))
            this.setData({
                purchaseWarehouseOrderDetail: purchaseWarehouseOrderItem,
                noticeHidden: true
            })
        }
    },
    // 税率点击
    bindTaxRagePickerChange(e) {
        var purchaseWarehouseOrderItem = clone(this.data.purchaseWarehouseOrderDetail)
        var value = e.detail.value
        purchaseWarehouseOrderItem.taxRageIndex = value
        purchaseWarehouseOrderItem.taxRate = purchaseWarehouseOrderItem.taxRageArr[value].id
        this.setData({
            purchaseWarehouseOrderDetail: purchaseWarehouseOrderItem
        })
        // 算一下税额
        this.calculateTaxAmount(purchaseWarehouseOrderItem.taxRate)
    },
    calculateTaxAmount(taxRate) {
        // 未税金额=价税合计/(1+税率/100)
        const number = this.data.purchaseWarehouseOrderDetail.number ?? 0
        const discountAmount = this.data.purchaseWarehouseOrderDetail.discountAmount ?? 0
        const price = this.data.purchaseWarehouseOrderDetail.price ?? 0
        const amount = NP.minus(NP.times(number, price), discountAmount) || 0
        const untaxedAmount = (NP.divide(amount, NP.plus(1, NP.divide(taxRate, 100)))).toFixed(2)
        this.setData({
            purchaseWarehouseOrderDetail: {
                ...this.data.purchaseWarehouseOrderDetail,
                untaxedAmount,
                formatUntaxedAmount: formatNumber(Number(untaxedAmount).toFixed(2)),
                originUntaxedAmount: untaxedAmount,
                formatOriginUntaxedAmount: formatNumber(Number(untaxedAmount).toFixed(2)),
                taxAmount: NP.minus(Number(amount), Number(untaxedAmount)),
                formatTaxAmount: formatNumber(NP.minus(Number(amount), Number(untaxedAmount)).toFixed(2))
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
    submitPurchaseWarehouseOrderDetail() {
        const validSuccess = this.valid(this.data.purchaseWarehouseOrderDetail)
        if (validSuccess) {
            this.setData({
                purchaseWarehouseOrderDetailArr: this.data.purchaseWarehouseOrderDetailArr.concat(this.data.purchaseWarehouseOrderDetail)
            })
            this.addLoading()
            wx.setStorage({
                key: 'newPurchaseWarehouseOrderDetailArr',
                data: this.data.purchaseWarehouseOrderDetailArr,
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
        const validSuccess = this.valid(this.data.purchaseWarehouseOrderDetail)
        if (validSuccess) {
            this.setData({
                purchaseWarehouseOrderDetailArr: this.data.purchaseWarehouseOrderDetailArr.concat(this.data.purchaseWarehouseOrderDetail)
            })
            this.setData({
                purchaseWarehouseOrderDetail: wx.getStorageSync('initPurchaseWarehouseOrderDetail')
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