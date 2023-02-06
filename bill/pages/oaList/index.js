var app = getApp()
app.globalData.loadingCount = 0
import {formatNumber, request} from '../../../util/getErrorMessage'

Page({
    data: {
        isPhoneXSeries: false,
        undo: true,
        list: [],
        scrollTop: 0,
        billName: {
            '4': '借款单',
            '9': '报销单',
            '3': '付款申请单',
            '101': '采购订单',
            '105': '采购入库单',
            '115': '库存调拨单'
        },
        billType: {
            '4': 'J',
            '9': 'B',
            '3': 'F',
            '101': 'JCD',
            '105': 'JCR',
            '115': 'allocate'
        },
        billUrl: {
            'J': '/bill/pages/viewJiekuan/index',
            'B': '/bill/pages/viewBaoxiao/index',
            'F': '/bill/pages/viewFukuan/index',
            'JCD': '/jxc/pages/viewPurchaseOrder/index',
            'JCR': '/jxc/pages/viewPurchaseWarehouseOrder/index',
            'allocate': '/jxc/pages/viewWarehouseAllocateOrder/index',
        }
    },
    onLoad() {
        this.getOaList()
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries,
        })
    },
    onShow() {
        this.getOaList()
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
    getOaList() {
        const url = this.data.undo ?
            app.globalData.url + 'oaTaskController.do?todoDatagrid&field=id,accountbookId,accountbookName,billType,billCode,billId,submitterDepartmentId,submitterDepartmentName,submitterName,createDate,billAmount,taskEndTime,taskEndTime_begin,taskEndTime_end,activeUserNames,taskName,'
            :
            app.globalData.url + 'oaTaskController.do?finishDatagrid&field=id,accountbookId,accountbookName,billType,billCode,billId,submitterDepartmentId,submitterDepartmentName,submitterName,createDate,billAmount,taskEndTime,taskEndTime_begin,taskEndTime_end,activeUserNames,taskName,'
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url,
            method: 'POST',
            success: res => {
                if(res.statusCode === 200) {
                    const billTypes = ['4', '9', '3', '101', '105', '115']
                    this.setData({
                        list: res.data.rows.filter(item => billTypes.includes(item.billType)).map(item => {
                            return {
                                ...item,
                                billType: this.data.billType[item.billType],
                                billName: this.data.billName[item.billType],
                                billClass: this.data.billType[item.billType].toLowerCase(),
                                billAmount: formatNumber(Number(item.billAmount).toFixed(2))
                            }
                        })
                    })
                    console.log(this.data.list, 'list')
                }
            }
        })
    },
    toggleUndo() {
        this.setData({
            undo: !this.data.undo
        })
        this.getOaList()
    },
    gotoBillDetail(e) {
        const id = e.currentTarget.dataset.id
        const processInstanceId = e.currentTarget.dataset.processinstanceid
        const billType = e.currentTarget.dataset.type
        const billId = e.currentTarget.dataset.billid
        const showOaOperate = e.currentTarget.dataset.showoaoperate
        wx.navigateTo({
            url: `${this.data.billUrl[billType]}?id=${billId}&processInstanceId=${processInstanceId}&oaId=${id}&showOaOperate=${showOaOperate}`
        })
    }
})
