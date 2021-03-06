Page({
    data: {
        errorData: {
            type: 'empty',
            title: '什么都没有了',
            button: '返回',
            onButtonTap: 'handleBack',
            href: '/pages/index/index',
        },
    },
    handleBack() {
        wx.reLaunch({
            url: '/pages/index/index'
        })
    },
    handleErrorButtonTap(e) {
        const { dataset } = e.currentTarget;
        if (dataset.href) {
            wx.redirectTo({url: dataset.href});
        } else {
            console.warn('no href specified');
        }
    }
})
