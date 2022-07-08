import {login} from "./util/getErrorMessage";

App({
    onLaunch(options) {
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
        // url: "https://www.caika.net/saas/",
        url: "https://www.caika.net/ucommune-test/",
        "corpId": "wwbc109332dfcce85c",
        "tenantCode": "db_ck_ucommune_test",
        // 沃土
        // corpId: 'ww239da829e102ac9d',
        // tenantCode: 'db_ck_wtsw',
        // 北京凡影
        // corpId: 'wwbc0416559b69864b',
        // tenantCode: 'db_ck_fykj2021'
        // 财咖
        // url: "https://www.caika.net/caika/",
        // corpId: "wwc5c826092131ecb7",
        // tenantCode: 'db_ck_online2021'
        // demo
        // corpId: "wwbc109332dfcce85c",
        // tenantCode: 'db_ck_demo'
        // 上方股份
        // corpId: "wwd1120d9b6c216447",
        // tenantCode: 'db_ck_medicine'
        // 中杰超润
        // corpId: "ww32d0d93a731b5cba",
        // tenantCode: 'db_ck_gyry',
        // 高远瑞研
        // corpId: "wwb785d3a227d6f3e5",
        // tenantCode: 'db_ck_gyry',
        // 旧城
        // corpId: "wwa718a47febbbb5df",
        // tenantCode: "db_ck_education"
        // 大华
        // corpId: "wwe16e82bb20ce2d17",
        // tenantCode: "db_ck_kh2021"
    }
});
