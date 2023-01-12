var app = getApp()
app.globalData.loadingCount = 0
import {formatNumber, request} from '../../../util/getErrorMessage'

Page({
    data: {
        startX: 0, //开始坐标
        startY: 0,
        isPhoneXSeries: false,
        type: '',
        scrollTop: 0,
        maskHidden: true,
        hidden: true,
        topHidden: true,
        animationInfo: {},
        animationInfoImg: {},
        animationInfoTopList: {},
        selectedType: 'ALL',
        selectedText: '全部',
        list: [],
        inputValue: '',
        filterList: [],
        statusObj: {
            10: "待提交",
            20: "待审批",
            25: "审批驳回",
            30: "已审批",
        },
        applicantType: {
            10: "职员",
            20: "供应商",
            30: "客户"
        },
    },
    //手指触摸动作开始 记录起点X坐标
    touchstart: function (e) {
        //开始触摸时 重置所有删除
        this.data.list.forEach(function (v, i) {
            if (v.isTouchMove)//只操作为true的
                v.isTouchMove = false;
        })
        this.setData({
            startX: e.changedTouches[0].clientX,
            startY: e.changedTouches[0].clientY,
            list: this.data.list,
            filterList: this.data.list
        })
    },
    //滑动事件处理
    touchmove: function (e) {
        var that = this,
            index = e.currentTarget.dataset.index,//当前索引
            startX = that.data.startX,//开始X坐标
            startY = that.data.startY,//开始Y坐标
            touchMoveX = e.changedTouches[0].clientX,//滑动变化坐标
            touchMoveY = e.changedTouches[0].clientY,//滑动变化坐标
            //获取滑动角度
            angle = that.angle({X: startX, Y: startY}, {X: touchMoveX, Y: touchMoveY});
        that.data.filterList.forEach(function (v, i) {
            v.isTouchMove = false
            //滑动超过30度角 return
            if (Math.abs(angle) > 30) return;
            if (i == index) {
                if (touchMoveX > startX) //右滑
                    v.isTouchMove = false
                else //左滑
                    v.isTouchMove = true
            }
        })
        //更新数据
        that.setData({
            list: that.data.list,
            filterList: this.data.list
        })
    },
    /**
     * 计算滑动角度
     * @param {Object} start 起点坐标
     * @param {Object} end 终点坐标
     */
    angle: function (start, end) {
        var _X = end.X - start.X,
            _Y = end.Y - start.Y
        //返回角度 /Math.atan()返回数字的反正切值
        return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
    },
    toggleHidden() {
        this.setData({
            hidden: !this.data.hidden
        })
        if (this.data.hidden) {
            this.animationImg.rotate(0).step()
            this.animationTopList.translateY('-200%').step()
            const t = setTimeout(() => {
                this.setData({
                    topHidden: true
                })
                clearTimeout(t)
            })
        } else {
            this.setData({
                topHidden: false
            })
            this.animationImg.rotate(180).step()
            this.animationTopList.translateY(0).step()
        }
        this.setData({
            animationInfoImg: this.animationImg.export(),
            animationInfoTopList: this.animationTopList.export(),
        })
    },
    onLoad(query) {
        const {type} = query
        this.getAll(this.data.selectedType)
    },
    getListByListStatus(e) {
        const billStatus = e.currentTarget.dataset.status
        const selectedType = this.data.selectedType
        this.getAll(selectedType, billStatus)
    },
    getAllList() {
        this.animationImg.rotate(0).step()
        this.animationTopList.translateY('-200%').step()
        this.setData({
            hidden: true,
            animationInfoImg: this.animationImg.export(),
            animationInfoTopList: this.animationTopList.export(),
            selectedType: 'ALL',
            selectedText: '全部'
        })
        this.getAll('ALL')
    },
    getAll(selectedType, billStatus) {
        if (selectedType == 'ALL') {
            this.requestAllList({
                purchaseOrder: 'purchaseOrder',
                purchaseWarehouseOrder: 'purchaseWarehouseOrder',
            }, billStatus)
        } else {
            this.singleListLogic(selectedType, billStatus)
        }
    },
    requestAllList(status, billStatus) {
        const {purchaseOrder, purchaseWarehouseOrder} = status
        Promise.all([
            this.getPurchaseOrderList(purchaseOrder, billStatus),
            this.getPurchaseWarehouseOrderList(purchaseWarehouseOrder, billStatus),
        ]).then(res => {
            let allList = []
            res.forEach(item => {
                allList.push(...item.list)
            })
            allList.sort((a, b) => a.businessDateTime < b.businessDateTime ? 1 : -1)
            allList = allList.map(item => {
                item.formatAmount = formatNumber(Number(item.originAmount).toFixed(2))
                item.billTypeClass = item.billType.toLowerCase()
                return item
            })
            this.setData({
                list: allList,
                filterList: allList
            })
            if(!!this.data.inputValue) {
                this.handleFilter(this.data.inputValue)
            }
        })
    },
    // 获取单个列表
    getSingleList(e) {
        const type = e.currentTarget.dataset.type
        this.singleListLogic(type)
    },
    singleListLogic(type, billStatus) {
        switch (type) {
            case 'purchaseOrder':
                this.handleSingleResult(this.getPurchaseOrderList.bind(this), type, billStatus)
                break
            case 'purchaseWarehouseOrder':
                this.handleSingleResult(this.getPurchaseWarehouseOrderList.bind(this), type, billStatus)
                break
        }
    },
    handleSingleResult(fn, selectedType, billStatus) {
        switch (selectedType) {
            case 'purchaseOrder':
                this.setData({
                    selectedText: '采购订单'
                })
                break;
            case 'purchaseWarehouseOrder':
                this.setData({
                    selectedText: '采购入库单'
                })
                break;
        }
        this.animationImg.rotate(0).step()
        this.animationTopList.translateY('-200%').step()
        this.setData({
            hidden: true,
            animationInfoImg: this.animationImg.export(),
            animationInfoTopList: this.animationTopList.export(),
            selectedType
        })
        fn(selectedType, billStatus).then(res => {
            res.list.sort((a, b) => a.createDate < b.createDate ? 1 : -1)
            res.list = res.list.map(item => {
                if (item.totalAmount) {
                    item.formatTotalAmount = formatNumber(Number(item.totalAmount).toFixed(2))
                } else {
                    item.formatAmount = formatNumber(Number(item.originAmount).toFixed(2))
                }
                return item
            })
            this.setData({
                list: res.list,
                filterList: res.list,
            })
            if(!!this.data.inputValue) {
                this.handleFilter(this.data.inputValue)
            }
        })
    },
    getPurchaseOrderList(type, billStatus="") {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: app.globalData.url + 'purchaseOrderController.do?datagrid&field=id,code,purchaseWarehousingOrderId,purchaseWarehousingOrderCode,businessDateTime,businessDateTime_begin,businessDateTime_end,accountbookId,accountbookIdReceive,accountbookEntity.accountbookName,decimalPrice,decimalNumber,submitterDepartmentId,departDetailEntity.depart.departName,purchaseUserId,user.realName,supplierDetailId,supplierDetailEntity.supplier.supplierName,deliveryDate,deliveryDate_begin,deliveryDate_end,currencyTypeId,originAmount,submitterUser.realName,accountbookIdReceiveName,exchangeRate,submitDateTime,submitDateTime_begin,submitDateTime_end,status,submitStockStatus,stockStatus,remark,',
                method: 'GET',
                data: {
                    status: billStatus
                },
                success: res => {
                    resolve({
                        list: res.data.rows.map(item => ({
                            ...item,
                            billType: type,
                            billTypeClass: type.toLowerCase(),
                            billName: '采购订单'
                        }))
                    })
                }
            })
        })
    },
    getPurchaseWarehouseOrderList(type, billStatus="") {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: app.globalData.url + 'purchaseWarehousingOrderController.do?datagrid&field=id,fictitiousOrderId,purchaseOrderId,code,purchaseOrderCode,fictitiousOrderCode,businessDateTime,businessDateTime_begin,businessDateTime_end,accountbookId,accountbookIdReceive,accountbookEntity.accountbookName,decimalPrice,decimalNumber,submitterDepartmentId,departDetailEntity.depart.departName,purchaseUserId,user.realName,supplierDetailId,supplierDetailEntity.supplier.supplierName,currencyTypeId,originAmount,submitterUser.realName,accountbookIdReceiveName,exchangeRate,submitDateTime,submitDateTime_begin,submitDateTime_end,status,submitReceiveStatus,receiveStatus,remark,',
                method: 'POST',
                data: {
                    status: billStatus
                },
                success: res => {
                    resolve({
                        list: res.data.rows.map(item => ({
                            ...item,
                            billType: type,
                            billTypeClass: type.toLowerCase(),
                            billName: '采购入库单'
                        }))
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
        app.globalData.loadingCount += 1
    },
    hideLoading() {
        if (app.globalData.loadingCount <= 1) {
            wx.hideLoading()
            app.globalData.loadingCount = 0
        } else {
            app.globalData.loadingCount -= 1
        }
    },
    onAddShow() {
        this.animation.translateY(0).step()
        this.setData({
            animationInfo: this.animation.export(),
            maskHidden: false
        })
    },
    onAddHide() {
        this.animation.translateY('100%').step()
        this.setData({
            animationInfo: this.animation.export(),
            maskHidden: true
        })
    },
    onShowAddJiekuan(e) {
        wx.navigateTo({
            url: '/bill/pages/addJiekuan/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddBaoxiao(e) {
        wx.navigateTo({
            url: '/bill/pages/addBaoxiao/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddKaipiao(e) {
        wx.navigateTo({
            url: '/bill/pages/addKaipiao/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddFukuan(e) {
        wx.navigateTo({
            url: '/bill/pages/addFukuan/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddJCD() {
        wx.navigateTo({
            url: '/jxc/pages/purchaseOrder/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddJCR() {
        wx.navigateTo({
            url: '/bill/pages/purchaseWarehouseOrder/index?type=add'
        })
        this.onAddHide()
    },
    onShow() {
        // 页面显示
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation

        var animationImg = wx.createAnimation({
            duration: 250,
            timeFunction: 'linear',
            transformOrigin: 'center center'
        })
        this.animationImg = animationImg
        animationImg.rotate(0).step()

        var animationTopList = wx.createAnimation({
            duration: 250,
            timeFunction: 'linear',
        })
        this.animationTopList = animationTopList
        animationTopList.translateY('-200%').step()

        this.setData({
            animationInfo: animation.export(),
            animationInfoImg: animationImg.export(),
            animationInfoTopList: animationTopList.export()
        })
    },
    goToEdit(e) {
        const id = e.currentTarget.dataset.id
        const status = e.currentTarget.dataset.status
        const type = e.currentTarget.dataset.type
        switch (type) {
            case 'purchaseOrder':
                //借款
                if (status == 10 || status == 25) {
                    this.setPage(`/jxc/pages/purchaseOrder/index?type=edit&id=${id}`)
                } else {
                    this.setPage(`/jxc/pages/viewPurchaseOrder/index?id=${id}`)
                }
                break;
            case 'purchaseWarehouseOrder':
                // 报销单
                if (status == 10 || status == 25) {
                    this.setPage(`/jxc/pages/purchaseWarehouseOrder/index?type=edit&id=${id}`)
                } else {
                    this.setPage(`/jxc/pages/viewPurchaseWarehouseOrder/index?id=${id}`)
                }
                break;
        }
    },
    setPage(url, id) {
        wx.navigateTo({
            url
        })
    },
    deleteBill(e) {
        const {id, type, status} = e.currentTarget.dataset
        let url = ''
        switch (type) {
            case 'purchaseOrder':
                url = app.globalData.url + 'purchaseOrderController.do?doBatchDel&ids=' + id
                break
            case 'purchaseWarehouseOrder':
                url = app.globalData.url + 'purchaseWarehousingOrderController.do?doBatchDel&ids=' + id
                break
        }
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该单据吗?',
            confirmText: '是',
            cancelText: '否',
            success: res => {
                this.setData({
                    x: 0
                })
                if (res.confirm) {
                    this.addLoading()
                    request({
                        hideLoading: this.hideLoading,
                        url,
                        method: 'GET',
                        success: res => {
                            if (res.data.success) {
                                this.getListByListStatus(e)
                            } else {
                                wx.showModal({
                                    content: '单据删除失败',
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
    clearWord() {
        this.setData({
            inputValue: ''
        })
        this.handleFilter('')
    },
    onChangeEnd(e) {
        this.setData({
            x: 300
        })
    },
    onChange(e) {
    },
    bindinput(e) {
        const text = e.detail.value
        this.handleFilter(text)
        this.setData({
            inputValue: e.detail.value
        })
    },
    handleFilter(text) {
        const filterList = this.data.list.filter(item => {
            const str = item.remark + (item.code)
            if (str.indexOf(text) != -1) {
                return item
            }
        })
        this.setData({
            filterList
        })
    }
})