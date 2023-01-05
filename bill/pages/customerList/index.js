var app = getApp()
Page({
    data:{
        isPhoneXSeries: false,
        customerList: [],
        searchResult: [],
        inputValue: ''
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        wx.getStorage({
            key: 'customerList',
            success: res => {
                this.setData({
                    customerList: res.data,
                    searchResult: res.data
                })
            }
        })
    },
    goBack(e) {
        const id = e.currentTarget.dataset.customerid
        const obj = this.data.customerList.filter(item => item.customerId === id)[0]
        const newObj = {
            id: obj.id,
            customerId: obj.customerId,
            invoiceAddress: obj.customer.invoiceAddress,
            invoicePhone: obj.customer.invoicePhone,
            bankName: obj.customer.bankName,
            bankAccount: obj.customer.bankAccount,
            invoiceType: obj.customer.invoiceType,
            customerName: obj.customer.customerName,
            taxCode: obj.customer.taxCode
        }
        wx.setStorageSync('customerDetail', newObj)
        wx.navigateBack({
            delta: 1
        })
    },
    bindinput(e) {
        const value = e.detail.value
        if(!!app.globalData.timeOutInstance) {
            clearTimeout(app.globalData.timeOutInstance)
        }
        this.setData({
            inputValue: value
        })
        this.searchFn(value)
    },
    clearWord() {
        this.setData({
            inputValue: ''
        })
        this.searchFn('')
    },
    searchFn(value) {
        app.globalData.timeOutInstance = setTimeout(() => {
            var searchResult = this.data.customerList.filter(item => item.customer.customerName.indexOf(value) !== -1)
            this.setData({
                searchResult: searchResult
            })
        }, 300)
    }
})
