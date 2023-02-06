import '../../../util/handleLodash';
import {cloneDeep as clone} from 'lodash';
import {formatNumber, validFn, request} from "../../../util/getErrorMessage";
import NP from "number-precision";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        noticeHidden: true,
        warehouseAllocateOrderDetail: {
            goodsName: '',
            goodsCode: '',
            goodsSpecs: '',
            auxiliaryAttributeName: '',
            unitId: '',
            sourceWarehouseId: '',
            targetWarehouseId: '',
            stockAmount: '',
            unitAmount: '',
            formatStockAmount: '',
            formatUnitAmount: '',
            remark: '',
        },
        warehouseAllocateOrderDetailArr: [],
        // 单位
        unitList: [],
        unitIndex: 0,
        // 仓库
        sourceWarehouseList: [],
        sourceWarehouseIndex: 0,
        targetWarehouseList: [],
        targetWarehouseIndex: 0,
        sourceAccountbookId: '',
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        const isEdit = wx.getStorageSync('edit')
        const initWarehouseAllocateOrderDetail = wx.getStorageSync('initWarehouseAllocateOrderDetail')
        const warehouseAllocateOrderDetail = wx.getStorageSync('warehouseAllocateOrderDetail')
        if (!warehouseAllocateOrderDetail) {
            this.setData({
                warehouseAllocateOrderDetail: {
                    ...this.data.warehouseAllocateOrderDetail,
                    ...initWarehouseAllocateOrderDetail
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
                warehouseAllocateOrderDetail: {
                    ...this.data.warehouseAllocateOrderDetail,
                    ...warehouseAllocateOrderDetail,
                },
            })
        }
    },
    // 获取调出仓库信息
    getSourceWarehouseListFromStorage() {
        const sourceWarehouseList = wx.getStorageSync('sourceWarehouseList') || []
        let sourceWarehouseIndex = 0
        if (this.data.warehouseAllocateOrderDetail.sourceWarehouseId) {
            sourceWarehouseList.forEach((item, index) => {
                if (item.warehouseId === this.data.warehouseAllocateOrderDetail.sourceWarehouseId) {
                    sourceWarehouseIndex = index
                }
            })
        }
        this.setData({
            sourceWarehouseList,
            sourceWarehouseIndex,
            warehouseAllocateOrderDetail: {
                ...this.data.warehouseAllocateOrderDetail,
                sourceWarehouseId: sourceWarehouseList[sourceWarehouseIndex].warehouseId
            }
        })
    },
    // 获取调入仓库信息
    getTargetWarehouseListFromStorage() {
        const targetWarehouseList = wx.getStorageSync('targetWarehouseList') || []
        let targetWarehouseIndex = 0
        if (this.data.warehouseAllocateOrderDetail.targetWarehouseId) {
            targetWarehouseList.forEach((item, index) => {
                if (item.warehouseId === this.data.warehouseAllocateOrderDetail.targetWarehouseId) {
                    targetWarehouseIndex = index
                }
            })
        }
        this.setData({
            targetWarehouseList,
            targetWarehouseIndex,
            warehouseAllocateOrderDetail: {
                ...this.data.warehouseAllocateOrderDetail,
                targetWarehouseId: targetWarehouseList[targetWarehouseIndex].warehouseId
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
                        warehouseAllocateOrderDetail: {
                            ...this.data.warehouseAllocateOrderDetail,
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
        const sourceAccountbookId = wx.getStorageSync('sourceAccountbookId') || ''
        const goodsInfo = wx.getStorageSync('goodsInfo') || {}
        this.getUnitList(goodsInfo.goodsUnit || this.data.warehouseAllocateOrderDetail.unitId)
        this.getStockNumber({
            accountbookId: sourceAccountbookId,
            unitId: goodsInfo.goodsUnit || this.data.warehouseAllocateOrderDetail.unitId,
            warehouseId: this.data.warehouseAllocateOrderDetail.sourceWarehouseId,
            goodsId: goodsInfo.id || this.data.warehouseAllocateOrderDetail.goodsId,
        })
        this.setData({
            warehouseAllocateOrderDetail: {
                ...this.data.warehouseAllocateOrderDetail,
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
    getStockNumber(params) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            method: 'GET',
            url: `${app.globalData.url}goodsController.do?getStockAmount&accountbookId=${params.accountbookId}&goodsId=${params.goodsId}&warehouseId=${params.warehouseId}&unitId=${params.unitId || null}`,
            success: res => {
                if(res.data || res.data == 0) {
                    this.setData({
                        warehouseAllocateOrderDetail: {
                            ...this.data.warehouseAllocateOrderDetail,
                            stockAmount: res.data,
                            formatStockAmount: formatNumber(Number(res.data).toFixed(2))
                        }
                    })
                }
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
                warehouseAllocateOrderDetail: {
                    ...this.data.warehouseAllocateOrderDetail,
                    [name]: this.data[listName][value].unitId
                }
            })
        }
        if (name === 'sourceWarehouseId') {
            this.setData({
                [index]: e.detail.value,
                warehouseAllocateOrderDetail: {
                    ...this.data.warehouseAllocateOrderDetail,
                    [name]: this.data[listName][value].warehouseId
                }
            })
            const sourceAccountbookId = wx.getStorageSync('sourceAccountbookId') || ''
            const {unitId, sourceWarehouseId, goodsId} = this.data.warehouseAllocateOrderDetail
            this.getStockNumber({
                accountbookId: sourceAccountbookId,
                unitId,
                warehouseId: sourceWarehouseId,
                goodsId,
            })
        }
        if (name === 'targetWarehouseId') {
            this.setData({
                [index]: e.detail.value,
                warehouseAllocateOrderDetail: {
                    ...this.data.warehouseAllocateOrderDetail,
                    [name]: this.data[listName][value].warehouseId
                }
            })
        }
    },
    onShow() {
        // 获取调出仓库信息
        this.getSourceWarehouseListFromStorage()
        // 获取调入仓库信息
        this.getTargetWarehouseListFromStorage()
        // 获取选择的商品详情
        this.getGoodsInfoFromStorage()
        // 获取计量单位
        this.getUnitList()
        // ========页面显示=======
        const warehouseAllocateOrderDetail = wx.getStorageSync('warehouseAllocateOrderDetail')
        if (!!warehouseAllocateOrderDetail) {
            this.setData({
                ...this.data.warehouseAllocateOrderDetail,
                ...warehouseAllocateOrderDetail,
                formatUnitAmount: formatNumber(Number(warehouseAllocateOrderDetail.unitAmount).toFixed(2)),
                formatStockAmount: formatNumber(Number(warehouseAllocateOrderDetail.stockAmount).toFixed(2)),
            })
        }
        wx.removeStorage({
            key: 'warehouseAllocateOrderDetail',
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
    onWarehouseAllocateOrderBlur(e) {
        const name = e.currentTarget.dataset.name
        this.setData({
            warehouseAllocateOrderDetail: {
                ...this.data.warehouseAllocateOrderDetail,
                [name]: e.detail.value,
            }
        })
        if(name === 'unitAmount') {
            this.setData({
                warehouseAllocateOrderDetail: {
                    ...this.data.warehouseAllocateOrderDetail,
                    formatUnitAmount: formatNumber(Number(e.detail.value).toFixed(2)),
                }
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
    submitWarehouseAllocateOrderDetail() {
        const validSuccess = this.valid(this.data.warehouseAllocateOrderDetail)
        if (validSuccess) {
            this.setData({
                warehouseAllocateOrderDetailArr: this.data.warehouseAllocateOrderDetailArr.concat(this.data.warehouseAllocateOrderDetail)
            })
            this.addLoading()
            wx.setStorage({
                key: 'newWarehouseAllocateOrderDetailArr',
                data: this.data.warehouseAllocateOrderDetailArr,
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
        const validSuccess = this.valid(this.data.warehouseAllocateOrderDetail)
        if (validSuccess) {
            this.setData({
                warehouseAllocateOrderDetailArr: this.data.warehouseAllocateOrderDetailArr.concat(this.data.warehouseAllocateOrderDetail)
            })
            this.setData({
                warehouseAllocateOrderDetail: wx.getStorageSync('initWarehouseAllocateOrderDetail')
            })
        }
    },
    valid(obj) {
        console.log(obj)
        if (!obj.goodsName) {
            validFn('请选择商品')
            return
        }
        if(!obj.stockAmount) {
            validFn('当前商品库存为0, 请重新选择商品')
            return
        }
        if(!obj.unitAmount) {
            validFn('请输入调拨数量')
            return
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
})
