<!-- @format -->
<template>
  <ExportPageLayout
    :loading="isExporting"
    @back="onBackToMainPage"
    @export="onExportBtnClick"
  >
    <PreviewVditor :pdata="pdata" />
  </ExportPageLayout>
</template>

<script>
import { generateScreenshot } from '@helper/export'
import PreviewVditor from '@components/PreviewVditor'
import ExportPageLayout from '@components/ExportPageLayout'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'export-image',

  data() {
    return {
      isLoading: true,
      isExporting: false,
      pdata: localStorage.getItem('vditorvditor'),
    }
  },

  components: {
    PreviewVditor,
    ExportPageLayout,
  },

  methods: {
    async exportAndDownloadImg(element, filename) {
      try {
        const canvas = await generateScreenshot(element)
        const isSupportDownload = 'download' in document.createElement('a')
        if (isSupportDownload) {
          const link = document.createElement('a')
          link.download = filename
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
      } catch (error) {
        ErrorHandler.handle(error, '导出图片', {
          userMessage: '导出图片失败，请重试'
        })
      } finally {
        this.isLoading = false
        this.isExporting = false
      }
    },
    /* ---------------------Callback Event--------------------- */
    onBackToMainPage() {
      this.$router.push('/')
    },
    onExportBtnClick() {
      this.isLoading = true
      this.isExporting = true
      const element = document.querySelector('#khaleesi .vditor-preview')
      const filename = this.$utils.getExportFileName()
      this.exportAndDownloadImg(element, filename)
    },
  },
}
</script>
