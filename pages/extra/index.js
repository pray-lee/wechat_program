import moment from "moment";
import '../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {formatNumber, validFn} from "../../util/getErrorMessage";

const app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        btnHidden: false,
        baoxiaoDetail: {},
        scrollId: "",
        extraList: [],
        extraMessage: [],
        subjectExtraConf: null,
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'subjectExtraConf',
            success: res => {
                this.setData({
                    subjectExtraConf: res.data,
                })
                wx.getStorage({
                    key: 'extraBaoxiaoDetail',
                    success: res1 => {
                        this.setData({
                            baoxiaoDetail: res1.data
                        })
                        if (!res1.data.extraList.length) {
                            this.onAddExtra()
                        }
                    }
                })
            }
        })
    },
    onShow() {
    },
    onClick() {
    },
    setScrollView(id) {
        this.setData({
            scrollId: id.toString()
        })
    },
    clearScrollView() {
        this.setData({
            scrollId: ''
        })
    },
    onAddExtra(e) {
        this.onClick()
        this.clearScrollView()
        let index = null
        if (!!e) {
            index = e.currentTarget.dataset.index
            // 校验
            const validSuccess = this.valid(this.data.baoxiaoDetail, index)
            if(!validSuccess) {
                return false
            }
        }
        if (this.data.subjectExtraConf) {
            var obj = this.generateExtraList(this.data.subjectExtraConf)
            var tempData = clone(this.data.baoxiaoDetail)
            if (!index && index !== 0) {
                tempData.extraList.push({conf: obj.array})
                tempData.extraMessage.push(obj.extraMessage)
            } else {
                tempData.extraList.splice(index + 1, 0, {conf: obj.array})
                tempData.extraMessage.splice(index + 1, 0, obj.extraMessage)
            }
            this.setData({
                baoxiaoDetail: tempData
            })
            // 看哪一个是附加信息金额
            this.data.baoxiaoDetail.extraList[0].conf.forEach((item, index) => {
                if (item.collectStatus == '1') {
                    app.globalData.caculateIndex = index
                }
            })
            this.setScrollView(index + 2)
        }
    },
    onCopyExtra(e) {
        // 校验
        this.clearScrollView()
        const index = e.currentTarget.dataset.index
        const validSuccess = this.valid(this.data.baoxiaoDetail, index)
        if(!validSuccess) {
            return false
        }
        const obj = this.generateExtraList(this.data.subjectExtraConf)
        const baoxiaoDetail = clone(this.data.baoxiaoDetail)
        baoxiaoDetail.extraList.splice(index + 1, 0, {conf: obj.array})
        baoxiaoDetail.extraMessage.splice(index + 1, 0, clone(baoxiaoDetail.extraMessage[index]))
        this.setData({
            baoxiaoDetail
        })
        this.setApplicationAmount()
        setTimeout(() => {
            this.setScrollView(index + 2)
        })
    },

    generateExtraList(conf) {
        var tempData = clone(conf)
        var array = []
        var extraMessage = []
        tempData.name.forEach((item, index) => {
            var obj = {}
            obj.field = item
            obj.type = tempData.type[index]
            obj.collectStatus = tempData.collectStatus[index] || '0'
            array.push(obj)
            if (obj.type == 2) {
                extraMessage.push(moment().format('YYYY-MM-DD'))
            } else {
                extraMessage.push('')
            }
        })
        return {
            array,
            extraMessage
        }
    },
    onExtraDateFocus(e) {
        var idx = e.currentTarget.dataset.index
        var extraIdx = e.currentTarget.dataset.extraindex
        // wx.datePicker({
        //     format: 'yyyy-MM-dd',
        //     currentDate: moment().format('YYYY-MM-DD'),
        //     success: (res) => {
        //         var tempData = clone(this.data.baoxiaoDetail)
        //         if (!!res.date) {
        //             tempData.extraMessage[extraIdx][idx] = res.date
        //             this.setData({
        //                 baoxiaoDetail: tempData
        //             })
        //         }
        //         // 解除focus不触发的解决办法。
        //         this.onClick()
        //     },
        // })
        var tempData = clone(this.data.baoxiaoDetail)
        tempData.extraMessage[extraIdx][idx] = e.detail.value
        this.setData({
           baoxiaoDetail: tempData
        })
        this.onClick()
    },
    onExtraBlur(e) {
        var idx = e.currentTarget.dataset.index
        var extraIdx = e.currentTarget.dataset.extraindex
        var name = e.currentTarget.dataset.name
        console.log(name)
        var tempData = clone(this.data.baoxiaoDetail)
        // 验证数字
        const field = tempData.extraList[extraIdx].conf[idx].collectStatus
        const numberReg = /^\d+(\.\d+)?$/
        if (field == '1') {
            app.globalData.caculateIndex = idx
            // 验证数字
            if(!numberReg.test(e.detail.value)) {
                wx.showModal({
                    content: '请输入合法金额',
                    confirmText: '确定',
                    showCancel: false,
                    success: res => {
                        return
                    }
                })
            }
        }
        tempData.extraMessage[extraIdx][idx] = e.detail.value
        this.setData({
            baoxiaoDetail: tempData
        })
        this.setApplicationAmount()
    },
    cancelExtra() {
        wx.navigateBack({
            delta: 1
        })
    },
    onExtraInput(e) {
        var idx = e.currentTarget.dataset.index
        var extraIdx = e.currentTarget.dataset.extraindex
        var tempData = clone(this.data.baoxiaoDetail)
        tempData.extraMessage[extraIdx][idx] = e.detail.value
        // 算附加信息金额
        const field = tempData.extraList[extraIdx].conf[idx].collectStatus
        if (field == '1') {
            app.globalData.caculateIndex = idx
        }
        this.setData({
            baoxiaoDetail: tempData
        })
        this.setApplicationAmount()
    },
    deleteExtra(e) {
        wx.showModal({
            title: '温馨提示',
            content: '确认删除该附加信息吗?',
            confirmText: '是',
            cancelText: '否',
            cancelColor: '#ff5252',
            success: (result) => {
                if (result.confirm) {
                    this.clearScrollView()
                    var idx = e.currentTarget.dataset.index
                    var tempData = clone(this.data.baoxiaoDetail)
                    if (tempData.extraList.length <= 1) {
                        return
                    }
                    tempData.extraMessage = tempData.extraMessage.filter((item, index) => index != idx)
                    tempData.extraList = tempData.extraList.filter((item, index) => index != idx)
                    this.setData({
                        baoxiaoDetail: tempData
                    })
                    this.setScrollView(idx + 1)
                    this.setApplicationAmount()
                }
            },
        });
    },
    setApplicationAmount() {
        let applicationAmount = 0
        this.data.baoxiaoDetail.extraMessage.forEach(item => {
            applicationAmount += Number(item[app.globalData.caculateIndex])
        })
        this.setData({
            baoxiaoDetail: {
                ...this.data.baoxiaoDetail,
                applicationAmount: applicationAmount.toFixed(2),
                formatApplicationAmount: formatNumber(Number(applicationAmount).toFixed(2))
            }
        })
    },

    onExtraSubmit() {
        this.setApplicationAmount()
        var tempData = clone(this.data.baoxiaoDetail)
        tempData.subjectExtraConf = JSON.stringify(this.data.subjectExtraConf)
        console.log(tempData.subjectExtraConf, '..............')
        for(let i = 0; i < tempData.extraMessage.length; i++) {
            if (!this.valid(tempData, i)) {
               return
            }
        }
        this.addLoading()
        wx.setStorage({
            key: 'baoxiaoDetail',
            data: tempData,
            success: res => {
                this.hideLoading()
                wx.navigateBack({
                    delta: 1
                })
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
    valid(obj, index) {
        const array = obj.extraMessage[index]
        const conf = obj.extraList[0].conf
        for(let i = 0; i < array.length; i++) {
            if(array[i] == '') {
                validFn(`请输入详情${index+1}的${conf[i].field}`)
                console.log(conf[i].field)
                return false
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
    }
})
