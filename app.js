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
        url: "https://www.caika.net/saas/",
        // corpId: "wwc5c826092131ecb7",
        corpId: "wwbc109332dfcce85c",
        tenantCode: 'db_ck_demo'
    }
});
