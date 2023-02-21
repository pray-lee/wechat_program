const getErrorMessage = string => {
    const error = string.match(/<\/P>[\W\w]+<P>/gi)[0]
    const newError = error.replace(/<[^>]+>/gi, "")
    const result = newError.replace(/[\r\n]/gi, "")
    wx.showModal({
        content: result,
        confirmText: '确定',
        showCancel: false,
        success: () => {
        },
    });
}

const submitSuccess = () => {
    console.log('submit success...')
    wx.reLaunch({
        url: '/pages/index/index'
    })
}

const loginFiled = (msg = "") => {
    wx.showModal({
        title: '登录失败',
        content: msg,
        confirmText: '确定',
        showCancel: false,
        success: () => {
            wx.reLaunch({
                url: '../error/index'
            })
        },
    });
}
const formatNumber = (num) => {
    return num && num.toString().replace(/\d+/, function (s) {
        return s.replace(/(\d)(?=(\d{3})+$)/g, '$1,')
    })
}

const validFn = message => {
    wx.showToast({
        icon: 'none',
        title: message
    })
}

const login = (app) => {
    wx.getAuthCode({
        success: (res) => {
            wx.httpRequest({
                url: app.globalData.url + "loginController.do?loginDingTalk&code=" + res.authCode + '&corpId=' + app.globalData.corpId,
                method: "GET",
                dataType: "json",
                success: res => {
                    if (res.data.success) {

                    } else {
                        console.log(res.data.msg)
                        loginFiled(res.data.msg)
                    }
                },
                fail: res => {
                    console.log(res, 'fail')
                    if (res.error == 19) {
                        loginFiled()
                    }
                    if (res.error == 12) {
                        loginFiled('网络异常')
                    }
                },
            })
        },
        fail: res => {
            console.log(res, 'outer failed')
            loginFiled('当前组织没有该小程序')
        }
    })
}

const request = option => {
    const sessionId = wx.getStorageSync('sessionId')
    const db = wx.getStorageSync('db')
    wx.request({
        url: option.url + '&db=' + db,
        dataType: 'json',
        data: option.data,
        header: {
            'cookie': sessionId,
            'content-type': 'application/x-www-form-urlencoded',
        },
        method: option.method,
        success: res => {
            console.log(new Date(), option.url)
            if (typeof res.data !== 'string' || res.data.indexOf('主框架') === -1) {
                option.success(res)
            }else{
                wx.removeStorage({
                    key: 'sessionId',
                    success: res => {
                        console.log('清除sessionId成功')
                    }
                })
                // wx.reLaunch({
                //     url: '/pages/index/index'
                // })
            }
        },
        fail: res => {
            if (typeof option.fail === 'function') {
                option.fail(res)
            }
        },
        complete: res => {
            if (typeof option.complete === 'function') {
                option.complete(res)
            }
            if (typeof option.hideLoading === 'function') {
                option.hideLoading()
            }
        }
    })
}

export {
    getErrorMessage,
    submitSuccess,
    loginFiled,
    formatNumber,
    validFn,
    login,
    request
}
