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
    handleFileChange (e) {
      const [file] = e.target.files
      if (!file) { return }
      this.file = file
    },
    async uploadFile () {
      if (!this.file) {
        return
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
