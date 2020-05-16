import axios from 'axios'
import Vue from 'vue'

// 创建axios 示例
const service = axios.create({
  baseURL: '/api', // url基础地址，解决不同数据源url变化问题
  // withCredentials: true, // 跨域时若要发送cookies需设置该选项
  timeout: 5000 // 超时
})

Vue.prototype.$http = service
