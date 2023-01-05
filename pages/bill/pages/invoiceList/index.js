import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'

var app = getApp()
app.globalData.loadingCount = 0
import {formatNumber, request} from '../../util/getErrorMessage'

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
        }
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries,
        })
        this.getInvoiceListByType(this.data.type, this.data.useStatus)
    },
    onReady() {

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
        this.getSelectOcrListFromStorage()
        this.getAddDetailFromStorage()
        this.getInvoiceAccountbookIdFromStorage()
    },
    onHide() {

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
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoiceInfoController.do?getInvoiceInfoByUserId',
            data: {
                invoiceType: type,
                useStatus,
            },
            method: 'GET',
            success: res => {
                if(res.data.success) {
                    if(res.data.obj.results.length) {
                        res.data.obj.results.forEach(item => {
                            item.formatJshj = formatNumber(Number(item.jshj).toFixed(2))
                            if(item.kprq) {
                                item.kprq = item.kprq.split(' ')[0]
                            }
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
    handleUpload() {
        this.goToInvoiceAccountbookList()
    },
    goToInvoiceAccountbookList() {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoiceConfigController.do?getAccountbookListByUserId&userId=' + app.globalData.applicantId,
            method: 'GET',
            success: res => {
                if (res.statusCode === 200) {
                    if(res.data && res.data.length) {
                        wx.setStorage({
                            key: 'invoiceAccountbookList',
                            data: res.data,
                            success: res => {
                                wx.navigateTo({
                                    url: "/pages/invoiceAccountbookList/index"
                                })
                            }
                        })
                    }else{
                        wx.showModal({
                            content: '当前用户没有开通发票模块',
                            confirmText: '好的',
                            showCancel: false,
                        })
                    }
                }
            }
        })
    },
    getInvoiceAccountbookIdFromStorage() {
        const accountbookId = wx.getStorageSync('invoiceAccountbookId')
        if(accountbookId) {
            wx.chooseImage({
                count: 9,
                success: res => {
                    this.uploadFile(res.tempFilePaths, accountbookId)
                },
                fail: res => {
                }
            })
            wx.removeStorage({
                key: 'invoiceAccountbookId',
                success: () => {}
            })
        }
    },
    invoiceInput() {
        wx.navigateTo({
            url: '/pages/invoiceInput/index'
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

                    }
                })
            })
        }
    },
    doOCR(fileList, accountbookId) {
        this.addLoading()
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoiceInfoController.do?doOCR',
            data: {
                fileList: JSON.stringify(fileList),
                accountbookId
            },
            method: 'POST',
            success: res => {
                if(res.data.success) {
                    if(res.data.obj.length){
                        const result = this.hasInvoiceType(res.data.obj)
                        // 去发票编辑页面
                        if(result) {
                            wx.setStorage({
                                key: 'ocrList',
                                data:res.data.obj,
                                success: () => {
                                    wx.navigateTo({
                                        url: '/pages/invoiceSelect/index?invoiceAccountbookId=' + accountbookId
                                    })
                                }
                            })
                        }
                    }
                }else{
                    wx.showModal({
                        content: res.data.msg,
                        confirmText: '好的',
                        showCancel: false,
                    })
                }
            }
        })
    },
    hasInvoiceType(data) {
        var noSupportInvoiceType = data.filter(item => !!this.data.nosupportInvoiceType[item.invoiceType])
        if(noSupportInvoiceType && noSupportInvoiceType.length) {
            wx.showModal({
                content: `暂不支持${this.data.nosupportInvoiceType[noSupportInvoiceType[0].invoiceType]}，请重新上传`,
                confirmText: '好的',
                showCancel: false,
            })
            return false
        }
        return true
    },
    previewFile(e) {
        var url = e.currentTarget.dataset.url
        wx.previewImage({
            urls: [url],
        })
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
    saveInvoice(data) {
        data.forEach(item => {
            if(item.formatJshj) {
                delete item.formatJshj
            }
        })
        // 飞机行程单特殊处理
        data.forEach(item => {
            if(item.invoiceType == '93') {
                if(!item.qtsf) {
                    item.qtsf = 0
                }
            }
        })
        this.addLoading()
        this.addSuffix(data)
        request({
            hideLoading: this.hideLoading,
            url: app.globalData.url + 'invoiceInfoController.do?doAddList',
            method: 'POST',
            headers:  {'Content-Type': 'application/json;charset=utf-8'},
            data: JSON.stringify(data),
            success: res => {
                // 刷新发票列表
                if(res.data.success) {
                    this.onLoad()
                }else{
                    wx.showModal({
                        content: res.data.msg,
                        confirmText: '好的',
                        showCancel: false,
                    })
                }
            },
            fail: res => {
            },
            complete: res => {
                this.onAddHide()
            }
        })
    },
    addSuffix(data) {
        data && data.length && data.forEach(item => {
            Object.keys(item).forEach(key => {
                if(typeof item[key] == 'string' && key == 'kprq' || key == 'rq') {
                    if(item[key].indexOf(' ') < 0)
                        item[key] = `${item[key]} 00:00:00`
                }
            })
        })
    },
    getSelectOcrListFromStorage() {
        const data = wx.getStorageSync('selectOcrList')
        if(data) {
            this.saveInvoice(data)
            wx.removeStorage({
                key: 'selectOcrList',
                success: () => {}
            })
        }
    },
    getAddDetailFromStorage() {
        const data = wx.getStorageSync('addInvoiceDetail')
        if(data) {
            this.saveInvoice([data])
            wx.removeStorage({
                key: 'addInvoiceDetail',
                success: () => {}
            })
        }
    },
    deleteInvoice(e) {
        const id = e.currentTarget.dataset.id
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该发票吗?',
            confirmText: '是',
            cancelText: '否',
            cancelColor: '#ff5252',
            success: res => {
                if(res.confirm) {
                    this.addLoading()
                    request({
                        hideLoading: this.hideLoading(),
                        url: app.globalData.url + 'invoiceInfoController.do?doBatchDel',
                        data: {
                            ids: id
                        },
                        method: 'GET',
                        success: res => {
                            if(res.data.success) {
                                this.onLoad()
                            }
                        },
                        fail: error => {
                            wx.showModal({
                                content: '删除失败',
                                confirmText: '好的',
                                showCancel: false,
                            })
                        }
                    })
                }
            }
        })
    },
})
