<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
 
  <MainLayout v-if="route.path !== '/login'" />
  <router-view v-else />
</template>
