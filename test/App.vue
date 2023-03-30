<template>
    <h1>你好VUE</h1>
    <span class="info">My name is <code class="red">{{ name }}</code>.</span>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';

    const name = '小明';
    export default defineComponent({
        setup(){
            return {
                name
            }
        }
    })
</script>
<style scoped lang="scss">
    .info{
        display: block;
        margin: 10px;
        .red{
            color:red;
        }
    }
    

</style>