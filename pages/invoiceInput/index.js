import moment from "moment";
import {cloneDeep as clone} from "lodash";

var app = getApp()
app.globalData.loadingCount = 0
import {formatNumber, request} from '../../util/getErrorMessage'
Page({
    data: {
        imgUrl: '',
        fromDetail: false,
        fromStorage: false,
        fromEditStorage: false,
        accountbookDisabled: false,
        isPhoneXSeries: false,
        scrollTop: 0,
        type: 'zzs',
        typeClass: 'zzs',
        typeText: '增值税发票',
        zzsIndex: 0,
        zzsList: [
            {
                name: '专用',
                invoiceType: '01'
            },
            {
                name: '电子专用',
                invoiceType: '08'
            },
            {
                name: '普通',
                invoiceType: '04'
            },
            {
                name: '电子普通',
                invoiceType: '10'
            },
        ],
        hidden: true,
        topHidden: true,
        animationImg: {},
        animationInfoTopList: {},
        accountbookIndex: 0,
        accountbookList: [],
        submitData: {
            invoiceType: '01',
            accountbookId: '',
            uploadType: '1',
            invoiceDetailEntityList: [{}]
        }
    },
    // 从单据详情来的
    getFromDetailFromStorage() {
        const fromDetail = wx.getStorageSync('fromDetail')
        if(fromDetail) {
            this.setData({
                fromDetail
            })
            wx.removeStorage({
                key: 'fromDetail',
                success: res => {}
            })
        }
    },
    // 从识别编辑页来的
    getEditInvoiceDetailFromStorage() {
        const editInvoiceDetail = wx.getStorageSync('editInvoiceDetail')
        if(editInvoiceDetail) {
            const arr = ['01', '04', '08', '10', '11']
            const type = arr.includes(editInvoiceDetail.invoiceType) ? 'zzs' : editInvoiceDetail.invoiceType
            if(editInvoiceDetail.invoiceFileEntityList.length) {
                this.setData({
                    imgUrl: editInvoiceDetail.invoiceFileEntityList[0].uri
                })
            }
            this.setData({
                fromEditStorage: true,
                type,
                submitData: {
                    ...this.data.submitData,
                    ...editInvoiceDetail,
                    uploadType: '2'
                }
            })
            wx.removeStorage({
                key: 'editInvoiceDetail',
                success: res => {}
            })
        }
    },
    // 从列表页来的
    getInvoiceDetailFromStorage() {
        const invoiceDetail = wx.getStorageSync('invoiceDetail')
        if(invoiceDetail) {
            const arr = ['01', '04', '08', '10', '11']
            const type = arr.includes(invoiceDetail.invoiceType) ? 'zzs' : invoiceDetail.invoiceType
            this.getInvoiceImgUrl(invoiceDetail.id)
            this.setData({
                fromStorage: true,
                type,
                submitData: {
                    ...this.data.submitData,
                    ...invoiceDetail
                }
            })
            wx.removeStorage({
                key: 'invoiceDetail',
                success: res => {}
            })
        }
        if(!this.data.fromStorage) {
            this.getAccountbookList()
        }
    },
    getInvoiceImgUrl(id) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoiceInfoController.do?getInvoiceInfoByIds',
            data: {
                ids: id,
            },
            method: 'GET',
            success: res => {
                if(res.data.success) {
                    if(res.data.obj.length) {
                        if(res.data.obj[0].invoiceFileEntityList.length) {
                            this.setData({
                                imgUrl: res.data.obj[0].invoiceFileEntityList[0].uri,
                                submitData: {
                                    ...this.data.submitData,
                                    invoiceDetailEntityList: res.data.obj[0].invoiceDetailEntityList
                                }
                            })
                        }
                    }
                }
            }
        })
    },
    previewFile(e) {
        var url = e.currentTarget.dataset.url
        if(url.includes('pdf')) {
            wx.showModal({
                content: '暂不支持预览PDF文件',
                confirmText: '好的',
                showCancel: false,
            })
            return
        }
        wx.previewImage({
            urls: [url],
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
            animationInfoTopList: animationTopList.export()
        })
        this.getInvoiceDetailFromStorage()
        this.getEditInvoiceDetailFromStorage()
        this.getFromDetailFromStorage()
    },
    onHide() {

    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries,
        })
        this.setCurrentDate()
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
    toggleTemplate(e) {
        this.animationImg.rotate(0).step()
        this.animationTopList.translateY('-200%').step()
        const type = e.currentTarget.dataset.type
        const typeClass = e.currentTarget.dataset.class
        this.clearSubmitData()
        this.setType(type, typeClass)
        this.setCurrentDate()
    },
    clearSubmitData() {
        const accountbookId = this.data.submitData.accountbookId
        const uploadType = this.data.submitData.uploadType
        const invoiceType = this.data.submitData.invoiceType
        this.setData({
            submitData: {
                accountbookId,
                uploadType,
                invoiceType
            }
        })
    },
    setCurrentDate() {
        const type = this.data.type
        const time = type == '93' ? 'rq' : 'kprq'
        if(time != 'rq') {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    [time]: moment().format('YYYY-MM-DD')
                }
            })
        }else{
            const obj = this.data.submitData.invoiceDetailEntityList ? this.data.submitData.invoiceDetailEntityList[0] : {}
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    // invoiceDetailIntityList: {
                    //     [time]: moment().format('YYYY-MM-DD')
                    // }
                    invoiceDetailEntityList: [{...obj, [time]: moment().format('YYYY-MM-DD')}]
                }
            })
        }
    },
    setType(type, typeClass) {
        let typeText = ''
        let invoiceType = type
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
        if(type == 'zzs') {
            invoiceType = this.data.zzsList[this.data.zzsIndex].invoiceType
        }
        this.setData({
            hidden: true,
            animationInfoImg: this.animationImg.export(),
            animationInfoTopList: this.animationTopList.export(),
            type,
            typeText,
            typeClass,
            submitData: {
                ...this.data.submitData,
                invoiceType
            }
        })
    },
    bindObjPickerChange(e) {
        var name = e.currentTarget.dataset.name
        var listName = e.currentTarget.dataset.list
        var value = e.detail.value
        var index = e.currentTarget.dataset.index
        if(name !== 'accountbookId') {
            this.setData({
                [index]: e.detail.value,
                submitData: {
                    ...this.data.submitData,
                    [name]: this.data[listName][value].invoiceType
                }
            })
        }else{
            this.setData({
                [index]: e.detail.value,
                submitData: {
                    ...this.data.submitData,
                    [name]: this.data[listName][value].id
                }
            })
        }
    },
    getAccountbookList() {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoiceConfigController.do?getAccountbookListByUserId&userId=' + app.globalData.applicantId,
            method: 'GET',
            success: res => {
                console.log(res)
                if(res.statusCode === 200) {
                    if(res.data && res.data.length) {
                        var accountbookIndex = 0
                        var accountbookId = res.data[0].id
                        var accountbookIdStorage = wx.getStorageSync('accountbookId')
                        if(accountbookIdStorage) {
                            this.setData({
                                accountbookDisabled: true
                            })
                            res.data.forEach((item, index) => {
                                if (item.id === accountbookIdStorage) {
                                    accountbookIndex = index
                                    accountbookId = accountbookIdStorage
                                }
                            })
                            wx.removeStorage({
                                key: 'accountbookId',
                                success: () => {}
                            })
                        }else{
                            this.setData({
                                accountbookDisabled: false
                            })
                        }
                        this.setData({
                            accountbookList: res.data,
                            accountbookIndex: accountbookIndex,
                            submitData: {
                                ...this.data.submitData,
                                accountbookId
                            }
                        })
                    }else{
                        wx.showModal({
                            content: '当前用户没有开通发票模块',
                            confirmText: '好的',
                            showCancel: false,
                            success: res => {
                                wx.navigateBack({
                                    delta: 1
                                })
                            }
                        })
                    }
                }
            },
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
    onBusinessFocus(e) {
        const name = e.currentTarget.dataset.name
        if(name !== 'rq') {
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    [name]: e.detail.value
                },
            })
        }else{
            const obj = this.data.submitData.invoiceDetailEntityList ? this.data.submitData.invoiceDetailEntityList[0] : {}
            this.setData({
                submitData: {
                    ...this.data.submitData,
                    invoiceDetailEntityList: [{...obj, [name]: e.detail.value}]
                },
            })
        }
    },
    onBlur(e) {
        this.setData({
            submitData: {
                ...this.data.submitData,
                [e.currentTarget.dataset.name]: e.detail.value
            },
        })
    },
    saveInvoice() {
        let key = ''
        if(this.data.fromEditStorage) {
            // 识别完成编辑,返回到识别页面
            key = 'editInvoiceDetail'
        }else if(!this.data.fromDetail){
            key = 'addInvoiceDetail'
        }else if(this.data.fromDetail) {
            key = 'billInvoiceDetail'
        }

         let submitData = clone(this.data.submitData)
        if(submitData.invoiceType == '93') {
            if(!submitData.qtsf) {
                submitData.qtsf = 0
            }
        }
        wx.setStorage({
            key,
            data: submitData,
            success: res => {
                wx.navigateBack({
                    delta: 1
                })
            }
        })
    },
})

