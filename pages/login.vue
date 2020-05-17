<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="form" :rules="rules" class="login-form" label-width="100px">
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
      <!-- 邮箱验证码 -->
      <el-form-item prop="emailcode" label="邮箱验证码" class="captcha-container">
        <div class="captcha">
          <el-button type="primary" :disabled="send.timer>0" @click="sendEmailCode">
            {{ sendText }}
          </el-button>
        </div>
        <el-input v-model="form.emailcode" placeholder="请输入验证码" />
      </el-form-item>
      <!-- 密码 -->
      <el-form-item prop="password" label="密码">
        <el-input v-model="form.password" placeholder="请输入密码" show-password />
      </el-form-item>
      <el-button type="primary" @click.native.prevent="handleLogin">
        Login
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
        password: '123456',
        emailcode: ''
      },
      code: {
        captcha: '/api/captcha'
      },
      send: {
        timer: 0
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入正确的邮箱' }
        ],
        captcha: [{ required: true, message: '请输入图片验证码' }],
        emailcode: [{ required: true, message: '请输入邮箱验证码' }],
        password: [
          { required: true, pattern: /^[\w_-]{6,12}$/g, message: '请输入6-12位密码' }
        ]
      }
    }
  },
  computed: {
    sendText () {
      if (this.send.timer <= 0) {
        return '发送'
      }
      return `${this.send.timer}s后发送`
    }
  },
  methods: {
    async sendEmailCode () {
      await this.$http.get('/sendCode?email=' + this.form.email)
      this.send.timer = 10
      this.timer = setInterval(() => {
        this.send.timer -= 1
        if (this.send.timer === 0) {
          clearInterval(this.timer)
        }
      }, 1000)
    },
    resetCaptcha () {
      this.code.captcha = '/api/captcha?_t=' + new Date().getTime()
    },
    handleLogin () {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          const obj = {
            email: this.form.email,
            captcha: this.form.captcha,
            emailcode: this.form.emailcode,
            password: md5(this.form.password)
          }
          const ret = await this.$http.post('/user/login', obj)
          console.log('handleLogin ret=', ret)
          if (ret.code === 0) {
            this.$message.success('登录成功')
            // 返回token
            setTimeout(() => {
              this.$router.push('/')
            }, 500)
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

<style lang="stylus">

</style>
