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
    <div>
      <p>计算hash的进度</p>
      <el-progress :text-inside="true" :stroke-width="20" :percentage="hashProgress" />
    </div>
    <div>
      <!-- 网格进度条，尽可能让方块看起来是正方形 -->
      <div class="cube-container" :style="{width: cubeWidth +'px'}">
        <div v-for="chunk in chunks" :key="chunk.name" class="cube">
          <div
            :class="{
              'uploading': chunk.progress > 0 && chunk.progress < 100,
              'success': chunk.progress==100,
              'error': chunk.progress<0,
            }"
            :style="{height: chunk.progress+'%'}"
          >
            <i
              v-if="chunk.progress >0 && chunk.progress < 100"
              class="el-icon-loading"
              style="color:#f56c6c"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SparkMD5 from 'spark-md5'
const CHUNK_SIZE = 0.5 * 1024 * 1024
export default {
  data () {
    return {
      file: null,
      // uploadProgress: 0,
      chunks: [],
      hashProgress: 0
    }
  },
  computed: {
    cubeWidth () { // 方块宽度， 每个方块16px
      return Math.ceil(Math.sqrt(this.chunks.length)) * 16
    },
    uploadProgress () {
      if (!this.file || this.chunks.length) {
        return 0
      }
      const loaded = this.chunks.map(item => item.chunk.size * item.progress) // 当前chunk上传的大小
        .reduce((acc, cur) => acc + cur, 0) // 累加
      return Number(((loaded * 100) / this.file.size).toFixed(2))
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
    createFileChunk (size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0
      while (cur < this.file.size) {
        chunks.push({ index: cur, file: this.file.slice(cur, cur + size) })
        cur += size
      }
      return chunks
    },
    async calculateHashWorker (chunks) {
      return await new Promise((resolve) => {
        this.hashWorker = new Worker('/hash.js') // 创建后台任务
        this.hashWorker.postMessage({ chunks }) // 把chunks发送到最近的外层对象
        this.hashWorker.onmessage = (e) => { // 处理从worker回传的消息
          const { progress, hash } = e.data
          this.hashProgress = Number(progress.toFixed(2))
          console.log('this.hashProgress=', this.hashProgress)
          if (hash) {
            resolve(hash)
          }
        }
      })
    },
    async calculateHashIdel (chunks) {
      return await new Promise((resolve) => {
        const spark = new SparkMD5.ArrayBuffer()
        const chunksLen = chunks.length
        let chunkIndex = 0
        const appendToSpark = async (file) => {
          return await new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)// 异步读取文件
            reader.onload = (e) => { // 读取完成后触发
              spark.append(e.target.result) // Append array buffer
              resolve()
            }
          })
        }
        const workLoop = async (deadline) => {
          while (chunkIndex < chunksLen && deadline.timeRemaining() > 1) {
            // 空闲时间，且有任务

            await appendToSpark(chunks[chunkIndex].file)
            chunkIndex++
            // hash 进度条
            if (chunkIndex < chunksLen) {
              this.hashProgress = Number(((100 * chunkIndex) / chunksLen).toFixed(2))
            } else { // 计算完成
              console.log('finished loading')
              this.hashProgress = 100
              resolve(spark.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }
        window.requestIdleCallback(workLoop)
      })
    },
    async calculateHashSimple () {
      return await new Promise((resolve) => {
        const spark = new SparkMD5.ArrayBuffer()
        const reader = new FileReader()
        const file = this.file
        const size = file.size
        const offset = 2 * 1024 * 1024 // 以2M为单位

        // 第一个和最后一个取全部，其他部分去前中后各取两个子节
        const chunks = [file.slice(0, offset)]
        let cur = offset
        while (cur < size) {
          if (cur + offset >= size) {
            // 最后一个区块全取
            chunks.push(file.slice(cur, cur + offset))
          } else {
            // 中间的区块取前中后各两节
            const mid = cur + offset / 2
            const end = cur + offset
            chunks.push(file.slice(cur, cur + 2))
            chunks.push(file.slice(mid, mid + 2))
            chunks.push(file.slice(end - 2, end))
          }
          cur += offset
        }
        reader.readAsArrayBuffer(new Blob(chunks))
        reader.onload = (e) => {
          spark.append(e.target.result) // Append array buffer
          this.hashProgress = 100
          resolve(spark.end())
        }
      })
    },
    async uploadChunks () {
      const requests = this.chunks
        .map((chunk, index) => {
          const form = new FormData()
          form.append('name', chunk.name)
          form.append('hash', chunk.hash)
          form.append('chunk', chunk.chunk)
          return form
        })
        .map((form, index) => {
          this.$http.post('/uploadFile', form, {
            // onUploadProgress (progressEvent) { // uploadProgress 不起作用
            onUploadProgress: (progressEvent) => {
              this.chunks[index].progress = Number(((progressEvent.loaded / progressEvent.total) * 100).toFixed(2))
            }
          })
        })

      await Promise.all(requests)
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

      // 文件切片
      const chunks = this.createFileChunk()
      console.log('chunks=', chunks)

      // 计算文件hash
      // const hash = await this.calculateHashWorker(chunks)
      // console.log('uploadFile hash=', hash)
      // const hash1 = await this.calculateHashIdel(chunks)
      // console.log('uploadFile hash1=', hash1)
      const hash = await this.calculateHashSimple()
      console.log('uploadFile hash=', hash)

      // 格式化chunks为form data
      this.chunks = chunks.map((chunk, index) => {
        // 切片的名字hash + index
        const name = hash + '-' + index
        return {
          hash,
          name,
          index,
          chunk: chunk.file,
          progress: 0
        }
      })
      console.log('this.chunks=', this.chunks)
      await this.uploadChunks()
      // const formData = new FormData()
      // formData.append('name', 'file')
      // formData.append('file', this.file)

      // const ret = await this.$http.post('/uploadFile', formData, {
      //   // onUploadProgress (progressEvent) { // uploadProgress 不起作用
      //   onUploadProgress: (progressEvent) => {
      //     this.uploadProgress = Number(((progressEvent.loaded / progressEvent.total) * 100).toFixed(2))
      //     console.log(this.uploadProgress)
      //   }
      // })
      // console.log(ret)
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
.cube-container
  .cube
    width 14px
    height 14px
    line-height 12px
    border 1px black solid
    background  #eee
    float left
    >.success
      background green
    >.uploading
      background blue
    >.error
      background red
</style>
