var app = getApp()
app.globalData.loadingCount = 0
import {formatNumber, request} from '../../util/getErrorMessage'

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
        isComplete: false,
        list: [],
        inputValue: '',
        filterList: [],
        statusObj: {
            10: "待提交",
            20: "待审批",
            25: "审批驳回",
            30: "已审批",
            60: "已提交付款",
            80: "已付款",
            100: "已完成"
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
        if (type === 'all') {
            this.getAll(this.data.selectedType)
            this.setData({
                isComplete: true,
            })
        } else {
            this.getComplete(this.data.selectedType)
            this.setData({
                isComplete: false,
            })
        }
    },
    getListByListStatus() {
        // 已完成，未完成的单据
        const isComplete = this.data.isComplete
        const selectedType = this.data.selectedType
        if (isComplete) {
            // 已完成
            this.getComplete(selectedType)
            this.setData({
                isComplete: false
            })
        } else {
            // 未完成
            this.getAll(selectedType)
            this.setData({
                isComplete: true
            })
        }
    },
    getComplete(selectedType) {
        if (selectedType == "ALL") {
            this.requestAllList({
                J: 'status_begin=80',
                B: 'status_begin=80',
                F: 'status_begin=80',
                K: 'status_begin=100'
            })
        } else {
            if (selectedType !== 'K') {
                this.singleListLogic(selectedType, 'status_begin=80')
            } else {
                this.singleListLogic(selectedType, 'status_begin=100')
            }
        }
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
        if(!this.data.isComplete) {
            this.getComplete('ALL')
        }else{
            this.getAll('ALL')
        }
    },
    getAll(selectedType) {
        if (selectedType == 'ALL') {
            this.requestAllList({
                J: 'status_end=79',
                B: 'status_end=79',
                F: 'status_end=79',
                K: 'status_end=99'
            })
        } else {
            if (selectedType !== 'K') {
                this.singleListLogic(selectedType, 'status_end=79')
            } else {
                this.singleListLogic(selectedType, 'status_end=99')
            }
        }
    },
    /*
    * J: 借款单状态
    * K: 开票申请单状态
    * B: 报销单状态
    * F: 付款单状态
    * */
    requestAllList(status) {
        const {J, K, F, B} = status
        Promise.all([
            this.getJiekuanList(J),
            this.getBaoxiaoList(B),
            this.getKaipiaoList(K),
            this.getFukuanList(F)
        ]).then(res => {
            let allList = []
            res.forEach(item => {
                allList.push(...item.list)
            })
            allList.sort((a, b) => a.createDate < b.createDate ? 1 : -1)
            allList = allList.map(item => {
                if (item.totalAmount) {
                    item.formatTotalAmount = formatNumber(Number(item.totalAmount).toFixed(2))
                } else {
                    item.formatAmount = formatNumber(Number(item.amount).toFixed(2))
                }
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
        const isComplete = !this.data.isComplete
        if (isComplete) {
            if (type !== 'K') {
                this.singleListLogic(type, 'status_begin=80')
            } else {
                this.singleListLogic(type, 'status_begin=30')
            }
        } else {
            if (type !== 'K') {
                this.singleListLogic(type, 'status_end=79')
            } else {
                this.singleListLogic(type, 'status_end=29')
            }
        }
    },
    singleListLogic(type, status) {
        switch (type) {
            case 'J':
                this.handleSingleResult(this.getJiekuanList.bind(this), status, 'J')
                break
            case 'B':
                this.handleSingleResult(this.getBaoxiaoList.bind(this), status, 'B')
                break
            case 'K':
                this.handleSingleResult(this.getKaipiaoList.bind(this), status, 'K')
                break
            case 'F':
                this.handleSingleResult(this.getFukuanList.bind(this), status, 'F')
                break

        }
    },
    handleSingleResult(fn, status, selectedType) {
        switch (selectedType) {
            case 'J':
                this.setData({
                    selectedText: '借款单'
                })
                break;
            case 'B':
                this.setData({
                    selectedText: '报销单'
                })
                break;
            case 'K':
                this.setData({
                    selectedText: '开票申请单'
                })
                break;
            case 'F':
                this.setData({
                    selectedText: '付款申请单'
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
        fn(status).then(res => {
            res.list.sort((a, b) => a.createDate < b.createDate ? 1 : -1)
            res.list = res.list.map(item => {
                if (item.totalAmount) {
                    item.formatTotalAmount = formatNumber(Number(item.totalAmount).toFixed(2))
                } else {
                    item.formatAmount = formatNumber(Number(item.amount).toFixed(2))
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
    getJiekuanList(status) {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: app.globalData.url + 'borrowBillController.do?datagrid&reverseVerifyStatus=0&sort=updateDate&order=desc&' + status + '&field=id,,accountbookId,billCode,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankName_begin,incomeBankName_end,incomeBankAccount,incomeBankAccount_begin,incomeBankAccount_end,subjectName,auxpropertyNames,capitalTypeDetailEntity.detailName,amount,unpaidAmount,paidAmount,unverifyAmount,submitter.id,submitter.realName,invoice,contractNumber,submitDate,submitDate_begin,submitDate_end,status,businessDateTime,businessDateTime_begin,businessDateTime_end,remark,createDate,createDate_begin,createDate_end,updateDate,updateDate_begin,updateDate_end,accountbook.oaModule,',
                method: 'GET',
                success: res => {
                    resolve({
                        list: res.data.rows.map(item => ({
                            ...item,
                            billType: 'J',
                            billName: '借款单'
                        }))
                    })
                }
            })
        })
    },
    getBaoxiaoList(status) {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: app.globalData.url + 'reimbursementBillController.do?datagrid&reverseVerifyStatus=0&sort=updateDate&order=desc&' + status + '&field=id,billCode,accountbookId,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankAccount,invoice,applicationAmount,verificationAmount,totalAmount,unpaidAmount,paidAmount,unverifyAmount,businessDateTime,createDate,updateDate,remark,submitterId,submitter.realName,childrenCount,accountbook.oaModule,status',
                method: 'GET',
                success: res => {
                    resolve({
                        name: '报销单',
                        type: 'B',
                        list: res.data.rows.map(item => ({
                            ...item,
                            billType: 'B',
                            billName: '报销单'
                        }))
                    })
                }
            })
        })
    },
    getKaipiaoList(status) {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: app.globalData.url + 'invoicebillController.do?datagrid&sort=createDate&order=desc&' + status + '&field=id,createDate,invoicebillCode,accountbookId,accountbookName,submitterId,submitterName,submitterDepartmentId,departName,customerDetailId,customerName,invoiceType,taxRate,amount,unverifyAmount,unverifyReceivableAmount,submitDateTime,contacts,telephone,address,status,businessDateTime,remark,billCode',
                method: 'GET',
                success: res => {
                    resolve({
                        name: '开票申请单',
                        type: 'K',
                        list: res.data.rows.map(item => ({
                            ...item,
                            billType: 'K',
                            billName: '开票申请单',
                        }))
                    })
                }
            })
        })
    },
    getFukuanList(status) {
        return new Promise((resolve, reject) => {
            this.addLoading()
            request({
                hideLoading: this.hideLoading,
                url: app.globalData.url + 'paymentBillController.do?datagrid&reverseVerifyStatus=0&sort=createDate&order=desc&' + status + '&field=id,billCode,accountbookId,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,supplierId,supplierName,applicantType,applicantId,applicantName,submitterId,submitter.realName,incomeBankName,incomeBankAccount,invoice,applicationAmount,verificationAmount,totalAmount,unpaidAmount,paidAmount,unverifyAmount,businessDateTime,createDate,updateDate,remark,childrenCount,status,accountbook.oaModule,oaModule,',
                method: 'GET',
                success: res => {
                    resolve({
                        list: res.data.rows.map(item => ({
                            ...item,
                            billType: 'F',
                            billName: '付款申请单'
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
            url: '../addJiekuan/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddBaoxiao(e) {
        wx.navigateTo({
            url: '../addBaoxiao/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddKaipiao(e) {
        wx.navigateTo({
            url: '../addKaipiao/index?type=add'
        })
        this.onAddHide()
    },
    onShowAddFukuan(e) {
        wx.navigateTo({
            url: '../addFukuan/index?type=add'
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
            case 'J':
                //借款
                if (status == 10 || status == 25) {
                    this.setPage(`../addJiekuan/index?type=edit&id=${id}`)
                } else {
                    this.setPage(`../viewJiekuan/index?id=${id}`)
                }
                break;
            case 'B':
                // 报销单
                if (status == 10 || status == 25) {
                    this.setPage(`../addBaoxiao/index?type=edit&id=${id}`)
                } else {
                    this.setPage(`../viewBaoxiao/index?id=${id}`)
                }
                break;
            case 'K':
                if (status == 10 || status == 25) {
                    this.setPage(`../addKaipiao/index?type=edit&id=${id}`)
                } else {
                    this.setPage(`../viewKaipiao/index?id=${id}`)
                }
                // 开票单
                break;
            case 'F':
                if (status == 10 || status == 25) {
                    this.setPage(`../addFukuan/index?type=edit&id=${id}`)
                } else {
                    this.setPage(`../viewFukuan/index?id=${id}`)
                }
                // 付款单
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
            case 'J':
                url = app.globalData.url + 'borrowBillController.do?doBatchDel&ids=' + id
                break
            case 'B':
                url = app.globalData.url + 'reimbursementBillController.do?doBatchDel&ids=' + id
                break
            case 'F':
                url = app.globalData.url + 'paymentBillController.do?doBatchDel&ids=' + id
                break
            case 'K':
                url = app.globalData.url + 'invoicebillController.do?doBatchDel&ids=' + id
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
                                this.setData({
                                    isComplete: !this.data.isComplete
                                })
                                this.getListByListStatus()
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
            const str = item.remark + (item.billCode || item.invoicebillCode)
            if (str.indexOf(text) != -1) {
                return item
            }
        })
        this.setData({
            filterList
        })
    }
})
