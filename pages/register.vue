<template>
  <div class="login-container">
    <el-form ref="registerForm" :model="form" :rules="rules" class="login-form" label-width="100px">
      <!-- 网站图标 -->
      <div class="title-container">
        <img src="/logo.png" alt="">
      </div>
      <!-- 邮箱 -->
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>

      <!-- 验证码 -->
      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha">
          <img :src="code.captcha" @click="resetCaptcha">
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码" />
      </el-form-item>
      <!-- 昵称 -->
      <el-form-item prop="nickname" label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <!-- 密码 -->
      <el-form-item prop="password" label="密码">
        <el-input v-model="form.password" placeholder="请输入密码" show-password />
      </el-form-item>
      <!-- 确认密码 -->
      <el-form-item prop="repassword" label="确认密码">
        <el-input v-model="form.repassword" placeholder="请再次输入密码" show-password />
      </el-form-item>
      <el-button type="primary" @click.native.prevent="handleRegister">
        注册
      </el-button>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
  layout: 'login',
  data () {
    return {
      form: {
        email: 'yangwebtest@163.com',
        captcha: '',
        nickname: '糖炒栗子',
        password: '123456',
        repassword: '123456'
      },
      code: {
        captcha: '/api/captcha'
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入正确的邮箱' }
        ],
        captcha: [{ required: true, message: '请输入图片验证码' }],
        nickname: [{ required: true, message: '请输入昵称' }],
        password: [
          { required: true, pattern: /^[\w_-]{6,12}$/g, message: '请输入6-12位密码' }
        ],
        repassword: [
          { required: true, message: '请再次输入密码' },
          {
            validator: (rule, value, callback) => {
              if (value === '') {
                callback(new Error('请再次输入密码'))
              } else if (value !== this.form.password) {
                callback(new Error('两次输入密码不一致!'))
              } else {
                callback()
              }
            }
          }
        ]
      }
    }
  },
  methods: {
    resetCaptcha () {
      this.code.captcha = '/api/captcha?_t=' + new Date().getTime()
    },
    handleRegister () {
      this.$refs.registerForm.validate(async (valid) => {
        if (valid) {
          const obj = {
            email: this.form.email,
            nickname: this.form.nickname,
            captcha: this.form.captcha,
            password: md5(this.form.password)
          }
          const ret = await this.$http.post('/user/register', obj)
          console.log('handleRegister ret=', ret)
          if (ret.code === 0) {
            // 跳转到登录页
            // $alert(message, title, options) 或 $alert(message, options)
            this.$alert('注册成功', '成功', {
              confirmButtonText: '去登录',
              callback: () => {
                this.$router.push('/login')
              }
            })
          } else {
            // 提示错误信息
            this.$message.error(ret.message)
          }
        } else {
          console.log('校验失败!')
          return false
        }
      })
    }
  }
}
</script>

<style scoped></style>
