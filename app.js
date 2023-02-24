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
        // 大彬科技
        // url: "https://www.caika.net/saas/",
        // corpId: 'wwc7beab47a77cfb2e',
        // tenantCode: 'db_ck_dbjy',
        // 辉旺资本
        // url: "https://www.caika.net/caika/",
        // corpId: 'wwc49aa53dae2b3f3d',
        // tenantCode: 'db_ck_kh2021',
        // 即客办公
        // url: "https://www.caika.net/saas/",
        // corpId: 'wwf180a50d5157c473',
        // tenantCode: 'db_ck_jkyl',
        // 云尊府
        // url: "https://www.caika.net/caika/",
        // corpId: 'ww94bc2d53a7db24a6',
        // tenantCode: 'db_ck_yzf',
        // url: "https://www.caika.net/saas/",
        // url: "https://www.caika.net/ucommune-test/",
        // "corpId": "wwbc109332dfcce85c",
        // "tenantCode": "db_ck_ucommune_test",
        // 沃土
        // url: "https://www.caika.net/saas/",
        // corpId: 'ww239da829e102ac9d',
        // tenantCode: 'db_ck_wtsw',
        // 北京凡影
        url: "https://www.caika.net/saas/",
        corpId: 'wwbc0416559b69864b',
        tenantCode: 'db_ck_fykj2021'
        // 财咖
        // url: "https://www.caika.net/caika/",
        // corpId: "wwc5c826092131ecb7",
        // tenantCode: 'db_ck_online2021'
        // demo
        // url: "https://www.caika.net/saas/",
        // corpId: "wwbc109332dfcce85c",
        // tenantCode: 'db_ck_demo'
        // 上方股份
        // url: "https://www.caika.net/caika/",
        // corpId: "wwd1120d9b6c216447",
        // tenantCode: 'db_ck_medicine'
        // 中杰超润
        // url: "https://www.caika.net/saas/",
        // corpId: "ww32d0d93a731b5cba",
        // tenantCode: 'db_ck_gyry',
        // 高远瑞研
        // url: "https://www.caika.net/saas/",
        // corpId: "wwb785d3a227d6f3e5",
        // tenantCode: 'db_ck_gyry',
        // 旧城
        // url: "https://www.caika.net/caika/",
        // corpId: "wwa718a47febbbb5df",
        // tenantCode: "db_ck_education"
        // 大华
        // url: "https://www.caika.net/caika/",
        // corpId: "wwe16e82bb20ce2d17",
        // tenantCode: "db_ck_kh2021"
    }
});
