import {cloneDeep as clone} from "lodash";
import {formatNumber, request} from '../../util/getErrorMessage'

var app = getApp()
app.globalData.loadingCount = 0

Page({
    data: {
        startX: 0, //开始坐标
        startY: 0,
        type: 'zzs',
        typeText: '增值税发票',
        typeClass: 'zzs',
        useStatus: 0, // 使用状态
        isPhoneXSeries: false,
        list: [],
        maskHidden: true,
        scrollTop:0,
        hidden: true,
        topHidden: true,
        animationInfo: {},
        animationInfoImg: {},
        animationInfoTopList: {},
        inputValue: '',
        filterList: [],
        nosupportInvoiceType: {
            '02': '货运运输业增值税专用发票',
            '03': '机动车销售统一发票',
            '14': '通行费发票',
            '15': '二手车发票',
            '16': '区块链电子发票',
            '21': '全电发票（专用发票）',
            '22': '全电发票（普通发票）',
            '96': '国际小票',
            '85': '可报销其他发票',
            '86': '滴滴出行行程单',
            '87': '完税证明',
            '00': '其他未知票种',
        },
        accountbookId: ''
    },
    onLoad(query) {
        const accountbookId = query.accountbookId
        this.setData({
            accountbookId
        })
        this.getInvoiceListByType(this.data.type, this.data.useStatus)
    },
    onReady() {

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
    onShow() {

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
            animationInfoImg: animationImg.export(),
            animationInfoTopList: animationTopList.export()
        })
    },
    onHide() {

    },
    getInvoiceList(e) {
        this.animationImg.rotate(0).step()
        this.animationTopList.translateY('-200%').step()
        const type = e.currentTarget.dataset.type
        const typeClass = e.currentTarget.dataset.class
        this.setType(type, typeClass)
        this.getInvoiceListByType(type, this.data.useStatus)
    },
    setType(type, typeClass) {
        let typeText = ''
        switch(type) {
            case 'zzs':
               typeText = '增值税发票'
                break
            case '95':
                typeText = '定额发票'
                break
            case '93':
                typeText = '飞机行程单'
                break
            case '92':
                typeText = '火车票'
                break
            case '91':
                typeText = '出租车票'
                break
            case '88':
                typeText = '车船票'
                break
            case '98':
                typeText = '过路费'
                break
            case '97':
                typeText = '通用机打发票'
                break
        }
        this.setData({
            hidden: true,
            animationInfoImg: this.animationImg.export(),
            animationInfoTopList: this.animationTopList.export(),
            type,
            typeText,
            typeClass
        })
    },
    getInvoiceListByType(type, useStatus) {
        console.log(this.data.accountbookId, 'accountbookId')
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoiceInfoController.do?getInvoiceInfoByUserId',
            data: {
                invoiceType: type,
                useStatus,
                accountbookId: this.data.accountbookId
            },
            method: 'GET',
            success: res => {
                if(res.data.success) {
                    if(res.data.obj.results.length) {
                        res.data.obj.results.forEach(item => {
                            item.formatJshj = formatNumber(Number(item.jshj).toFixed(2))
                        })
                    }
                    this.setData({
                        list: res.data.obj.results || [],
                        filterList: res.data.obj.results || [],
                    })
                }
            }
        })
    },
    getInvoiceListByUseStatus() {
        // 已使用 1 未使用 0
        const useStatus = this.data.useStatus
        if(useStatus == 1) {
            this.setData({
                useStatus: 0
            })
            this.getInvoiceListByType(this.data.type, 0)
        }else{
            this.setData({
                useStatus: 1
            })
            this.getInvoiceListByType(this.data.type, 1)
        }
    },
    addLoading() {
        if (app.globalData.loadingCount < 1) {
            wx.showLoading({
                title: '加载中...',
                mask: true
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
    onInput(e) {
        const text = e.detail.value
        this.setData({
            inputValue: text
        })
        this.handleFilter(text)
    },
    clearWord() {
        this.setData({
            inputValue: ''
        })
        this.handleFilter('')
    },
    handleFilter(text) {
        const filterList = this.data.list.filter(item => {
            // 发票金额 账簿名称 发票号码
            const str = item.accountbookName + item.fphm + item.jshj
            if (str.indexOf(text) != -1) {
                return item
            }
        })
        this.setData({
            filterList
        })
    },
    goToEdit(e) {
        const invoiceDetail = this.data.filterList.filter(item => item.id == e.currentTarget.dataset.id)[0]
        wx.setStorage({
            key: 'invoiceDetail',
            data: invoiceDetail,
            success: res => {
                wx.navigateTo({
                    url: '/pages/invoiceInput/index'
                })
            }
        })
    },
    selectInvoice(e) {
        const index = e.currentTarget.dataset.index
        this.data.filterList[index].checked = true
    },
    saveInvoice() {
        const list = this.data.filterList.filter(item => !!item.checked)
        console.log(list, 'list.........')
        wx.setStorage({
            key: 'ocrListFromList',
            data: list,
            success: () => {
                wx.navigateBack({
                    delta: 1
                })
            }
        })
    }
})
