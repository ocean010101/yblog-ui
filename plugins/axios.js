import axios from 'axios'
import Vue from 'vue'
import { MessageBox } from 'element-ui'
const TOKEN_KEY = 'token'
// 创建axios 示例
const service = axios.create({
  baseURL: '/api' // url基础地址，解决不同数据源url变化问题
  // withCredentials: true, // 跨域时若要发送cookies需设置该选项
  // timeout: 5000 // 超时
})
export default ({ store, redirect }) => {
  // 请求拦截
  service.interceptors.request.use(
    function (config) {
      // Do something before request is sent
      // 如果用户成功， 给请求报文添加认证头部信息
      // const token = getToken()
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        config.headers.common.Authorization = 'Bearer ' + token
      }
      return config
    },
    function (error) {
      // Do something with request error
      return Promise.reject(error)
    }
  )

  // 响应拦截
  service.interceptors.response.use(
    function (response) {
      console.log('000==== response=', response)
      const { data, config } = response
      const code = data.code
      if (code === 0) {
        if (config.url === '/user/login') {
          // 登录成功
          // 保存token
          localStorage.setItem(TOKEN_KEY, data.data.token)
        }
      } else if (code === -666) {
        // token过期
        // 弹出提示框
        // $confirm(message, title, options)
        MessageBox.confirm('登录已过期', 'aaa', {
          confirmButtonText: '登录',
          showCancelButton: false, // 不显示cancle按钮
          type: 'warning'
        }).then(() => {
          // 删除token
          localStorage.removeItem(TOKEN_KEY)
          // 重定向到登录页面
          redirect({ path: '/login' })
        })
      }
      return data
    },
    function (error) {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      return Promise.reject(error)
    }
  )
}
Vue.prototype.$http = service
export const http = service
