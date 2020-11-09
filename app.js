import {login} from "./util/getErrorMessage";

App({
    onLaunch(options) {
        console.log('running....')
        // 获取设备信息
        const {model, environment} = wx.getSystemInfoSync()
        const isIphoneXSeries = model.indexOf('iPhone X') !== -1
        this.globalData.isPhoneXSeries = isIphoneXSeries ? true : false
        this.globalData.isWxWork = environment ? true : false
    },
    onShow(options) {
        // 从后台被 scheme 重新打开
        // options.query == {number:1}
        // login(this)
    },
    globalData: {
        "url": "https://www.caika.net/saas/",
        // "url": "http://192.168.1.104:8080/jeecg/",
        // "appId": 'wx07c16a39cd177974',
        "corpId": "wwc5c826092131ecb7"
        // 企业微信官方测试
        // "corpId": "ww17f8d10783494584",
    }
});
