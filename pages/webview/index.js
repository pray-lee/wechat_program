Page({
    data: {
        webViewUploadUrl: 'https://www.caika.net/test/aliyunController.do?goWxUploadFile',
        webViewPreviewUrl: 'https://www.caika.net/test/aliyunController.do?goWxPreviewFile',
        url:''
    },
    onLoad(query) {
        let url = ''
        if(query.url) {
            // 预览
            this.setData({
                url: this.data.webViewPreviewUrl + '&url=' + query.url
            })
        }else{
            // 上传
            this.setData({
                url: this.data.webViewUploadUrl
            })
        }
    },
    onMessage(e) {
        if(this.data.url === this.data.webViewUploadUrl) {
            this.receiveUploadMessage(e)
        } else{
            this.receivePreviewMessage(e)
        }
    },
    receivePreviewMessage(e) {
        // if(e.detail.data[0].back) {
        //     wx.navigateBack({
        //         delta: 1
        //     })
        // }
    },
    receiveUploadMessage(e) {
        const billFilesList = e.detail.data[0].fileLists
        billFilesList && wx.setStorage({
            key: 'uploadFileList',
            data: billFilesList,
            // success: () => {
                // wx.navigateBack({
                //     delta: 1
                // })
            // }
        })
    },
})