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
        animationInfo: {},
        list: [],
        statusObj: {
            10: "待提交",
            20: "待审批",
            25: "审批驳回",
            30: "已审批",
            60: "已提交付款",
            80: "已付款"
        },
            applicantType: {
                10: "职员",
                20: "供应商",
                30: "客户"
            },
            active: ''
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
            list: this.data.list
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
            angle = that.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY });
            that.data.list.forEach(function (v, i) {
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
            list: that.data.list
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
    setUrl(type) {
        var url = ''
        if (type === '10J') {
            url = app.globalData.url + 'borrowBillController.do?datagrid&reverseVerifyStatus=0&status=10&sort=updateDate&order=desc&field=id,,accountbookId,billCode,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankName_begin,incomeBankName_end,incomeBankAccount,incomeBankAccount_begin,incomeBankAccount_end,subject.fullSubjectName,auxpropertyNames,capitalTypeDetailEntity.detailName,amount,unpaidAmount,paidAmount,unverifyAmount,submitter.id,submitter.realName,invoice,contractNumber,submitDate,submitDate_begin,submitDate_end,status,businessDateTime,businessDateTime_begin,businessDateTime_end,remark,createDate,createDate_begin,createDate_end,updateDate,updateDate_begin,updateDate_end,accountbook.oaModule,'
        }
        if (type === '80J') {
            url = app.globalData.url + 'borrowBillController.do?datagrid&reverseVerifyStatus=0&sort=updateDate&order=desc&status_begin=80&field=id,,accountbookId,billCode,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankName_begin,incomeBankName_end,incomeBankAccount,incomeBankAccount_begin,incomeBankAccount_end,subject.fullSubjectName,auxpropertyNames,capitalTypeDetailEntity.detailName,amount,unpaidAmount,paidAmount,unverifyAmount,submitter.id,submitter.realName,invoice,contractNumber,submitDate,submitDate_begin,submitDate_end,status,businessDateTime,businessDateTime_begin,businessDateTime_end,remark,createDate,createDate_begin,createDate_end,updateDate,updateDate_begin,updateDate_end,accountbook.oaModule,'
        }
        if (type === '20J') {
            url = app.globalData.url + 'borrowBillController.do?datagrid&reverseVerifyStatus=0&sort=updateDate&order=desc&status_begin=11&status_end=79&field=id,,accountbookId,billCode,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankName_begin,incomeBankName_end,incomeBankAccount,incomeBankAccount_begin,incomeBankAccount_end,subject.fullSubjectName,auxpropertyNames,capitalTypeDetailEntity.detailName,amount,unpaidAmount,paidAmount,unverifyAmount,submitter.id,submitter.realName,invoice,contractNumber,submitDate,submitDate_begin,submitDate_end,status,businessDateTime,businessDateTime_begin,businessDateTime_end,remark,createDate,createDate_begin,createDate_end,updateDate,updateDate_begin,updateDate_end,accountbook.oaModule,'
        }
        if (type === '10B') {
            url = app.globalData.url + 'reimbursementBillController.do?datagrid&reverseVerifyStatus=0&sort=updateDate&order=desc&status=10&field=id,billCode,accountbookId,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankAccount,invoice,applicationAmount,verificationAmount,totalAmount,unpaidAmount,paidAmount,unverifyAmount,businessDateTime,createDate,updateDate,remark,submitterId,submitter.realName,childrenCount,accountbook.oaModule,status'
        }
        if (type === '80B') {
            url = app.globalData.url + 'reimbursementBillController.do?datagrid&reverseVerifyStatus=0&sort=updateDate&order=desc&status_begin=80&field=id,billCode,accountbookId,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankAccount,invoice,applicationAmount,verificationAmount,totalAmount,unpaidAmount,paidAmount,unverifyAmount,businessDateTime,createDate,updateDate,remark,submitterId,submitter.realName,childrenCount,accountbook.oaModule,status'
        }
        if (type === '20B') {
            url = app.globalData.url + 'reimbursementBillController.do?datagrid&reverseVerifyStatus=0&sort=updateDate&order=desc&status_begin=11&status_end=79&field=id,billCode,accountbookId,accountbook.accountbookName,submitterDepartmentId,departDetail.depart.departName,applicantType,applicantId,applicantName,incomeBankName,incomeBankAccount,invoice,applicationAmount,verificationAmount,totalAmount,unpaidAmount,paidAmount,unverifyAmount,businessDateTime,createDate,updateDate,remark,submitterId,submitter.realName,childrenCount,accountbook.oaModule,status'
        }
        return url
    },
    // scroll
    // onScroll(e) {
    //     const {scrollTop} = e.detail
    //     this.setData({
    //         scrollTop
    //     })
    // },
    // 点击tab页请求
    getData(e) {
        this.addLoading()
        // this.setData({
        //     scrollTop: 0
        // })
        var active = e.currentTarget.dataset.active
        var url = this.setUrl(active + this.data.flag)
        this.setData({
            active
        })
        request({
            hideLoading: this.hideLoading,
            url: url,
            method: 'GET',
            success: res => {
                let arr = []
                if(this.data.flag === 'J') {
                    arr = res.data.rows.map(item => {
                        return {
                            ...item,
                            amount: formatNumber(item.amount)
                        }
                    })
                }else{
                    arr = res.data.rows.map(item => {
                        return {
                            ...item,
                            totalAmount: formatNumber(item.totalAmount)
                        }
                    })
                }
                this.setData({
                    list: arr,
                })
            },
            fail: res => {
                console.log(res, 'failed')
            },
        })
    },
    onLoad(query) {
        console.log(query)
        // type是状态码
        var type = query.type
        // 区分是借款还是报销
        var flag = query.flag
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries,
            type: type + flag,
            active: type,
            flag
        })
        // 页面加载完成,设置请求地址
        var url = this.setUrl(type + flag)
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: url,
            method: 'GET',
            success: res => {
                console.log(res)
                let arr = []
                if(flag === 'J') {
                    arr = res.data.rows.map(item => {
                        return {
                            ...item,
                            amount: formatNumber(item.amount)
                        }
                    })
                }else{
                    arr = res.data.rows.map(item => {
                        return {
                            ...item,
                            totalAmount: formatNumber(item.totalAmount)
                        }
                    })
                }
                this.setData({
                    list: arr
                })
                console.log(arr)
            },
            fail: res => {
                console.log(res, 'failed')
            },
        })
    },
    addLoading() {
        if(app.globalData.loadingCount < 1) {
            wx.showLoading({
                content: '加载中...'
            })
        }
        app.globalData.loadingCount +=1
    },
    hideLoading() {
        if(app.globalData.loadingCount <= 1) {
            wx.hideLoading()
            app.globalData.loadingCount = 0
        }else{
            app.globalData.loadingCount-=1
        }
    },
    onAddShow() {
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        animation.translateY(0).step()
        this.setData({
            animationInfo: animation.export(),
            maskHidden: false
        })
    },
    onAddHide() {
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        animation.translateY('100%').step()
        this.setData({
            animationInfo: animation.export(),
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
    onShow() {
        // 页面显示
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        this.setData({
            animationInfo: animation.export()
        })
        //刷新
        const query = wx.getStorageSync('query')
        console.log(query)

        if(query) {
            // 如果是审批驳回的，返回20，进未完成tab
            if(query.type == 25) {
                query.type = 20
            }
            wx.removeStorage({
                key: 'query'
            })
            this.onLoad(query)
        }
    },
    goToEdit(e) {
        var id = e.currentTarget.dataset.id
        const status = e.currentTarget.dataset.status
        console.log(this.data.type, 'type')
        if(this.data.type.indexOf('B') != -1) {
            if(status == 10 || status == 25) {
                wx.navigateTo({
                    url: '../addBaoxiao/index?type=edit&id=' + id
                })
            }else{
                wx.navigateTo({
                    url: '../viewBaoxiao/index?id=' + id
                })
            }
        }else{
            if(status == 10 || status == 25) {
                wx.navigateTo({
                    url: '../addJiekuan/index?type=edit&id=' + id
                })
            }else{
                wx.navigateTo({
                    url: '../viewJiekuan/index?id=' + id
                })
            }
        }
    },
    deleteBill(e) {
        const {id, flag, status} = e.currentTarget.dataset
        console.log(status, 'deleteBill')
        let url = ''
        if(flag === 'J') {
            url = app.globalData.url + 'borrowBillController.do?doBatchDel&ids=' + id
        }else{
            url = app.globalData.url + 'reimbursementBillController.do?doBatchDel&ids=' + id
        }
        wx.confirm({
            title: '温馨提示',
            content: '确认删除该单据吗?',
            confirmButtonText: '是',
            cancelButtonText: '否',
            success: res => {
                this.setData({
                    x: 0
                })
                if(res.confirm) {
                    this.addLoading()
                    request({
                        hideLoading: this.hideLoading,
                        url,
                        method: 'GET',
                        success: res => {
                            console.log(res)
                            if(res.data.success) {
                                this.onLoad({
                                    flag,
                                    type: status == 25 ? 20 : status
                                })
                            }else{
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
    bindchangeEnd(e) {
        console.log(e)
        this.setData({
            x: 300
        })
    },
    bindchange(e) {
        console.log(e)
    }
})
