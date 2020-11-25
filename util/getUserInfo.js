export default {
  // getUserInfo() {
  //   // 页面加载
  //   console.info(`Page onLoad with query: ${JSON.stringify(query)}`);
  //   wx.getAuthCode({
  //   success:(res)=>{
  //       console.log(res.authCode)
  //   },
  //   fail: (er)=>{
  //       wx.alert({content: JSON.stringify(er)})
  //   }
  //   })
  //   // 请求access_token
  //   var timeStamp = new Date().getTime()
  //   var accessKey = app.globalData.CustomKey
  //   var suiteTicket = 'CK-caika'
  //   var signature = timeStamp + '\n' + suiteTicket
  //   wx.httpRequest({
  //     url: "https://oapi.dingtalk.com/service/get_corp_token?signature="+signature+"&timestamp="+timeStamp+"&suiteTicket="+suiteTicket+"&accessKey="+accessKey,
  //     method: "POST",
  //     data: {
  //       "auth_corpid": app.globalData.corpId
  //     },
  //     dataType: 'json',
  //     success: function(res) {
  //       console.log(res, 'success')
  //     },
  //     fail: function(res) {
  //       console.log(res, 'failed')
  //     },
  //     complete: function(res) {
  //       console.log(res, 'complete')
  //     }
  //   })
  // }
}
