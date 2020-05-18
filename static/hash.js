self.importScripts('spark-md5.min.js')
self.onmessage = (e) => {
  console.log('hash: e=', e)

  // 接收主线程传递的数据
  const { chunks } = e.data // 获取chunks
  const spark = new self.SparkMD5.ArrayBuffer()
  const chunksLen = chunks.length
  let chunkIndex = 0
  let progress = 0

  const loadNext = (index) => {
    const reader = new FileReader() // 用于读取文件
    reader.readAsArrayBuffer(chunks[index].file)
    reader.onload = (e) => {
      spark.append(e.target.result)
      chunkIndex++
      if (chunkIndex === chunksLen) { // 计算完成
        console.log('finished loading')
        self.postMessage({
          progress: 100,
          hash: spark.end() // computed hash
        })
      } else {
        progress += 100 / chunksLen
        self.postMessage({
          progress
        })
        loadNext(chunkIndex)
      }
    }
  }
  loadNext(chunkIndex)
}
