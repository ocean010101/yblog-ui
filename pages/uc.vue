<template>
  <div>
    <h1>用户中心</h1>
    <div id="drag" ref="drag">
      <input type="file" name="file" @change="handleFileChange">
    </div>
    <div>
      <el-progress :text-inside="true" :stroke-width="20" :percentage="uploadProgress" />
    </div>
    <div>
      <el-button @click="uploadFile">
        上传
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      file: null,
      uploadProgress: 0
    }
  },
  async mounted () {
    const ret = await this.$http.get('/user/info')
    console.log(ret)
    this.bindEvents()
  },
  methods: {
    bindEvents () {
      const drag = this.$refs.drag
      /* 放下目标节点时触发事件 */
      drag.addEventListener('dragover', (e) => {
        drag.style.borderColor = 'red'
        e.preventDefault()
      })
      drag.addEventListener('dragleave', (e) => {
        // 当拖动元素离开可放置目标节点，重置其背景
        drag.style.borderColor = '#eee'
        e.preventDefault()
      })
      drag.addEventListener('drop', (e) => {
        const fileList = e.dataTransfer.files
        drag.style.borderColor = '#eee'
        this.file = fileList[0]

        e.preventDefault()
      })
    },
    blobToString (blob) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = function (event) {
          const ret = reader.result.split('')
            .map(v => v.charCodeAt()) // 转换成10进制ASCII
            .map(v => v.toString(16).toUpperCase()) // 转换成16进制大写
            .map(v => v.padStart(2, '0')) // 左侧补0
            .join(' ')
          // 文件里的文本会在这里被打印出来
          // console.log(event.target.result)
          resolve(ret)
        }
        reader.readAsBinaryString(blob)
      })
    },
    async isGif (file) {
      const ret = await this.blobToString(file.slice(0, 6))
      const isGif = (ret === '47 49 46 38 39 61') || (ret === '47 49 46 38 37 61')
      return isGif
    },
    async isPng (file) {
      const ret = await this.blobToString(file.slice(0, 8))
      const isPng = (ret === '89 50 4E 47 0D 0A 1A 0A')
      return isPng
    },
    async isJpg (file) {
      const len = file.size
      const start = await this.blobToString(file.slice(0, 2))
      const tail = await this.blobToString(file.slice(-2, len))
      const isJpg = (start === 'FF D8' && tail === 'FF D9')
      return isJpg
    },
    async isImage (file) {
      // 通过文件后缀判定
      // const fileArr = file.split('.')
      // const ext = fileArr[1]

      // 通过读取文件的二进制流判定
      // 判定文件是否为GIF格式
      // return await this.isGif(file)
      // 判定文件是否为PNG格式
      // return await this.isPng(file)
      // 判定文件是否为JPG格式
      return await this.isJpg(file)
    },
    handleFileChange (e) {
      const [file] = e.target.files
      if (!file) { return }
      this.file = file
    },
    async uploadFile () {
      if (!this.file) {
        return
      }
      // 判断文件格式
      if (!await this.isImage(this.file)) {
        console.log('文件格式错误')
        return
      } else {
        console.log('文件格式正确')
      }
      const formData = new FormData()
      formData.append('name', 'file')
      formData.append('file', this.file)

      const ret = await this.$http.post('/uploadFile', formData, {
        // onUploadProgress (progressEvent) { // uploadProgress 不起作用
        onUploadProgress: (progressEvent) => {
          this.uploadProgress = Number(((progressEvent.loaded / progressEvent.total) * 100).toFixed(2))
          console.log(this.uploadProgress)
        }
      })
      console.log(ret)
    }
  }
}
</script>

<style lang="stylus">
#drag
  height  100px
  line-height 100px
  border 2px dashed #eeeeee
  text-align  center
  vertical-align middle
</style>
