import moment from 'moment'

import '../../../util/handleLodash'
import {cloneDeep as clone} from 'lodash'
import {formatNumber} from "../../../util/getErrorMessage";

const app = getApp()
Page({
    data: {
        tempImportList: [],
        filterList: [],
        startTime: '',
        endTime: '',
        isAllSelect:false,
        totalAmount: '0.00',
        num: 0,
        inputValue: '',
        // 发票
        origin: '',
    },
    onLoad(query) {
        if(query && query.origin)
            this.setData({
                origin: query.origin
            })
    },
    onShow() {
        let tempImportList = wx.getStorageSync('tempImportList')
        // 每一项加一个checked属性
        tempImportList.forEach(item => {
            item.checked = false
            item.businessDateTime = item.businessDateTime.split(' ')[0]
            item.formatUnverifyAmount = formatNumber(Number(item.unverifyAmount).toFixed(2))
        })
        this.setData({
            tempImportList,
            filterList: clone(tempImportList),
            isAllSelect: false
        })
    },
    onHide() {
    },
    bindinput(e) {
        this.setData({
            inputValue: e.detail.value
        })
        // 过滤
        this.searchResultUseInput(e.detail.value)
    },
    clearWord() {
        this.setData({
            inputValue: ''
        })
        this.searchResultUseInput('')
    },
    startTimeChange(e) {
        this.setData({
            startTime: e.detail.value
        })
        this.searchResultUseTime(e.detail.value, this.data.endTime)
    },
    endTimeChange(e) {
        this.setData({
            endTime: e.detail.value
        })
        this.searchResultUseTime(this.data.startTime, e.detail.value)
    },
    clearStartTime() {
        this.setData({
            startTime: ''
        })
        this.searchResultUseTime('', this.data.endTime)
    },
    clearEndTime() {
        this.setData({
            endTime: ''
        })
        this.searchResultUseTime(this.data.startTime, '')
    },
    onCheckboxChange(e) {
        const tempData = clone(this.data.filterList)
        tempData.forEach(item => {
            item.checked = false
        })
        e.detail.value.forEach(index => {
            tempData[index].checked = true
        })
        // 全选联动
        let isAllSelect = false
        if(tempData.every(item => item.checked)){
            isAllSelect = true
        }else{
            isAllSelect = false
        }
        this.setData({
            filterList: tempData,
            isAllSelect
        })
        this.caculateAmount()
    },
    // 全选
    onAllSelect(e) {
        const checked = e.detail.value.length
        let filterList = []
        if(!!checked) {
            filterList = this.data.filterList.map(item => ({
                ...item,
                checked: true
            }))
        }else{
            filterList = this.data.filterList.map(item => ({
                ...item,
                checked: false
            }))
        }
        this.setData({
            filterList,
            isAllSelect: checked ? true : false
        })
        this.caculateAmount()
    },
    caculateAmount() {
        let totalAmount = 0
        const checkList = this.data.filterList.filter(item => !!item.checked)
        checkList.forEach(item => {
            totalAmount += Number(item.unverifyAmount)
        })
        this.setData({
            totalAmount: formatNumber(Number(totalAmount).toFixed(2)),
            num: checkList.length
        })
    },
    searchResultUseTime(startTime, endTime) {
        startTime = startTime.replace(/\-/g, "/")
        startTime = new Date(startTime).getTime()
        endTime = endTime.replace(/\-/g, "/")
        endTime = new Date(endTime).getTime()
        const filterList = this.data.tempImportList.filter(item => {
            const businessDateTime = item.businessDateTime.split(' ')[0].replace(/\-/g, "/")
            if(!startTime && !!endTime) {
               return endTime >= new Date(businessDateTime).getTime()
            }else if(!endTime && !!startTime) {
                return startTime <= new Date(businessDateTime).getTime()
            }else if(!startTime && !endTime) {
                return true
            }else{
                return (startTime <= new Date(businessDateTime).getTime()) &&
                    (new Date(businessDateTime).getTime() <= endTime)
            }
        })
        this.setData({
            filterList,
            isAllSelect: false
        })
    },
    searchResultUseInput(text) {
        const filterList = this.data.tempImportList.filter(item => {
            const str = (item['subjectEntity.fullSubjectName'] || item['subject.fullSubjectName']) + (item.remark || '无')
            return str.indexOf(text) != -1
        })
        this.setData({
            filterList,
            isAllSelect: false
        })
    },
    onCheckboxSubmit() {
        const arr = this.data.filterList.filter(item => !!item.checked)
        var newArr = []
        for (var i = 0; i < arr.length; i++) {
            var temp = {
                ...arr[i],
                id: arr[i].id,
                billDetailId: arr[i].id,
                unverifyAmount: arr[i].unverifyAmount,
                readOnlyAmount: formatNumber(Number(arr[i].unverifyAmount).toFixed(2)),
                amount: arr[i].amount,
                remark: arr[i].remark,
                'subjectEntity.fullSubjectName': arr[i]['subjectEntity.fullSubjectName'] || arr[i]['subject.fullSubjectName'],
                'auxpropertyNames': arr[i].auxpropertyNames
            }
            // 单据号处理,需要显示一下这个信息, 这里还要加一个判断
            if(!!arr[i].receivablebillCode)
                // 应收单单号
                temp.receivablebillCode = arr[i].receivablebillCode
            else
                // 应付单单号
                temp.billCode = arr[i].billCode
            newArr.push(temp)
        }
        if(newArr.length) {
            wx.setStorage({
                key: 'importList',
                data: newArr,
                success: res => {
                    this.setData({
                        tempImportList: [],
                        filterList: [],
                        isAllSelect: false,
                        num: 0,
                        totalAmount: '0.00'
                    })
                    wx.navigateTo({
                        url: '/bill/pages/importYingshouInputList/index?origin=' + this.data.origin
                    })
                }
            })
        }else{
            wx.showModal({
                content: '请选择单据再导入',
                confirmText: '好的',
                showCancel: false,
            })
        }
    },
})
