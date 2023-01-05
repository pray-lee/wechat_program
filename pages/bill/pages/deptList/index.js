var app = getApp()
Page({
    data: {
        isPhoneXSeries: false,
        deptList: [],
        searchUserList: [],
        searchResult: [],
        inputValue: '',
        isFocus: false,
        allowMulti: false,
        animationInfo: {},
        bottomUserList: [],
    },
    onLoad() {
        this.setData({
            isPhoneXSeries: app.globalData.isPhoneXSeries
        })
        this.getAllowMulti()
        this.getSearchUserList()
        this.getDeptList()
    },
    showSelectedUserList() {
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'ease-in'
        })
        this.animation = animation
        animation.translateY(0).step()
        this.setData({
            animationInfo: animation.export(),
        })
    },
    hideSelectedUserList() {
        var animation = wx.createAnimation({
            duration: 250,
            timeFunction: 'linear'
        })
        this.animation = animation
        animation.translateY('100%').step()
        this.setData({
            animationInfo: animation.export(),
        })
    },
    getAllowMulti() {
        this.setData({
            allowMulti: wx.getStorageSync('allowMulti')
        })
    },
    getSearchUserList() {
        wx.getStorage({
            key: 'searchUserList',
            success: res => {
                this.setData({
                    searchUserList: res.data
                })
            }
        })
    },
    getStorageUserList() {
        const selectedUsers = wx.getStorageSync('selectedUsers')
        if(selectedUsers) {
            return selectedUsers[this.getSelectedIndex()]
        }
        return []
    },
    getSelectedIndex() {
        return wx.getStorageSync('nodeIndex')
    },
    onShow() {
        this.renderBottomUserList()
    },
    renderBottomUserList() {
        const selectedUsers = wx.getStorageSync('selectedUsers') || []
        let bottomUserList = []
        if(selectedUsers.length) {
             bottomUserList = selectedUsers[this.getSelectedIndex()]
        }else{
            bottomUserList = []
        }
        bottomUserList.forEach(item => {
            item.showName = item.name.slice(-2)
        })
        this.setData({
            bottomUserList
        })
    },
    removeUser(e) {
        const id = e.currentTarget.dataset.id
        const newArr = this.data.bottomUserList.filter(item => item.id !== id)
        const selectedUsers = wx.getStorageSync('selectedUsers')
        const nodeIndex = this.getSelectedIndex()
        selectedUsers[nodeIndex] = newArr
        wx.setStorageSync('selectedUsers', selectedUsers)
        this.onShow()
    },
    searchRadioChange(e) {
        const index = e.currentTarget.dataset.index
        const searchResult = this.data.searchResult.map(item =>({...item, userName: item.name, checked: false}))
        searchResult[index].checked = !searchResult[index].checked
        const selectedUsers = wx.getStorageSync('selectedUsers') || []
        const nodeIndex = this.getSelectedIndex()
        selectedUsers[nodeIndex] = [searchResult[index]]
        wx.setStorageSync('selectedUsers', selectedUsers)
        this.setData({
            searchResult
        })
        this.renderBottomUserList()
    },

    searchCheckboxChange(e) {
        const index = e.currentTarget.dataset.index
        this.data.searchResult[index].checked = !this.data.searchResult[index].checked
        this.setData({
            searchResult: this.data.searchResult
        })
        const checkedValues = this.data.searchResult.filter(item => !!item.checked)
        const selectedUserList = this.getStorageUserList()
        this.handleSearchUserList(selectedUserList, checkedValues)
        this.renderBottomUserList()
    },
    handleSearchUserList(selectedUserList, checkedValues) {
        // 用户列表和已选择列表取差集   当前页面没有选中的
        const storageUnCheckedUsers = this.data.searchResult.filter(item => selectedUserList.every(selected => selected.id !== item.id))

        // 用户列表和已选择列表取交集  当前页面被选中的
        const checkedUsers = this.data.searchResult.filter(item => selectedUserList.some(selected => selected.id === item.id))

        // 需要添加的
        const addChecked = checkedValues.filter(item => storageUnCheckedUsers.some(unChecked => unChecked.id === item.id))
        this.addChecked(selectedUserList, addChecked)

        // 需要删除的
        const removeChecked = checkedUsers.filter(item => checkedValues.every(checked => checked.id !== item.id))
        this.removeChecked(selectedUserList, removeChecked)
    },
    addChecked(selected, arr) {
        const newArr = selected.concat(arr)
        const selectedUsers = wx.getStorageSync('selectedUsers') || []
        const nodeIndex = this.getSelectedIndex()
        selectedUsers[nodeIndex] = newArr
        wx.setStorageSync(
            'selectedUsers',
            selectedUsers
        )
    },
    removeChecked(selected,arr) {
        let newArr = []
        if(arr.length) {
            arr.forEach(item => {
                selected.forEach(select => {
                    if(item.id !== select.id) {
                        newArr.push(select)
                    }
                })
            })
            const selectedUsers = wx.getStorageSync('selectedUsers') || []
            const nodeIndex = this.getSelectedIndex()
            selectedUsers[nodeIndex] = newArr
            wx.setStorageSync(
                'selectedUsers',
                selectedUsers
            )
        }
    },
    getDeptList() {
        wx.getStorage({
            key: 'deptList',
            success: res => {
                this.setData({
                    deptList: res.data,
                })
            }
        })
    },
    getNext(e) {
        const userList = e.currentTarget.dataset.userlist ? e.currentTarget.dataset.userlist.map(item => ({...item, userName: item.name})) : []
        const subDepartList = e.currentTarget.dataset.subdepartlist
        const delta = getCurrentPages().length
        wx.setStorageSync(
            'userList',
            userList
        )
        wx.setStorageSync('delta', delta - 1)
        wx.setStorage({
            key: 'subDepartList',
            data: subDepartList,
            success: res => {
                wx.navigateTo({
                    url: '/pages/approvalUserList/index'
                })
            }
        })

    },
    onInput(e) {
        const value = e.detail.value
        if (!!app.globalData.timeOutInstance) {
            clearTimeout(app.globalData.timeOutInstance)
        }
        if(value == '') {
            this.setData({
                isFocus: false,
            })
        }else{
            this.setData({
                isFocus: true,
            })
        }
        this.setData({
            searchResult: [],
            inputValue: value
        })
        this.searchFn(value)
        this.onShow()
    },
    clearWord() {
        this.setData({
            inputValue: '',
            searchResult: [],
            isFocus: false,
        })
        this.searchFn('')
        this.onShow()
    },
    goBack() {
        wx.navigateBack({
            delta: 1
        })
    },
    searchFn(value) {
        app.globalData.timeOutInstance = setTimeout(() => {
            var searchResult = this.data.searchUserList.filter(item => value && item.name.indexOf(value) !== -1)
            const newSearchResult = searchResult.map(item => ({...item, userName: item.name, checked: false}))
            this.setData({
                searchResult: newSearchResult
            })
            // 先看看当前页面的用户列表有没有已经选中的重复的用户,
            const selectedUserList = this.getStorageUserList()
            const checkedUsers = selectedUserList.filter(selected => this.data.searchResult.some(item => selected.id === item.id))
            if(checkedUsers.length) {
                for(let i = 0 ; i < this.data.searchResult.length; i++) {
                    const user = this.data.searchResult[i]
                    for(let j = 0; j < checkedUsers.length; j++) {
                        const checked = checkedUsers[j]
                        if(user.id === checked.id) {
                            this.data.searchResult[i] = Object.assign({}, checked)
                        }
                    }
                }
            }
            this.setData({
                searchResult:this.data.searchResult
            })
        }, 300)
    }
})
