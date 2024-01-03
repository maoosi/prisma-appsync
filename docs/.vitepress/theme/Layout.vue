<script setup>
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #aside-outline-after>
      <div class="content">
        <div class="title">Our sponsors</div>
        <div>
          <a href="https://kuizto.co/?utm_source=prisma_appsync&utm_medium=github" target="_blank">
            <img src="/sponsors/kuizto-square.png" alt="Kuizto — The Everyday Cooking App" />
          </a>
        </div>
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.content {
    position: relative;
    border-left: 1px solid var(--vp-c-divider);
    padding-left: 16px;
    font-size: 13px;
    font-weight: 500;
    margin-top: 64px;
}

.title {
  letter-spacing: 0.4px;
  line-height: 28px;
  font-size: 13px;
  font-weight: 600;
}
</style>