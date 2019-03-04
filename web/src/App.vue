<template>
<div class="app">
  <header class="app__header">
    <h1 class="app__title">
      SleightQuant: A Vuejs & Pythonic Algorithmic Trading Platform
    </h1>
  </header>
  <TVBrokerSample />
</div>
</template>

<script>
import TVChartContainer from './components/TVChartContainer.vue'
import TVBrokerSample from './components/TVBrokerSample.vue'
export default {
  name: 'app',
  components: {
    TVChartContainer,
    TVBrokerSample
  }
}
</script>

<style lang="scss" scoped>
.app {
    text-align: center;

    &__header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px 0;
        background-color: #222;
        color: #fff;
    }

    &__title {
        display: block;
        font-size: 1.5em;
    }
}
</style>
