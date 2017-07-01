<template>
    <div class="tab">
        <button class="tab-toggle" :class="{active : active}" @click="select">
            {{version}}
            <img v-if="androidLink" class="icon" :src="androidLogo">
            <img v-if="iosLink" class="icon" :src="iosLogo">
        </button>
    </div>
</template>
<script>

import androidLogo from 'images/androidLogo.png';
import iosLogo from 'images/iosLogo.png';
import $ from 'jquery';
import VersionDetails from './VersionDetails.vue';

export default {
    components : {
        VersionDetails :VersionDetails
    },
    props: {
        appName: {
            type: String,
            required: true
        },
        version: {
            type: String,
            required: true
        },
        hidden: {
            type: Boolean,
            default: false
        },
        androidLink: {
            type: String,
            default: null
        },
        iosLink: {
            type: String,
            default: null
        },
        active : {
            type: Boolean,
            default: false
        }
    },
    created() {
        this.androidLogo = androidLogo;
        this.iosLogo = iosLogo;
    },
    methods:{
        select($event){
            this.$emit('selected', this.version);
        }
    }
}
</script>
<style lang="sass" scoped>

@import "assets/css/colors";

.tab {

    .tab-toggle {
        position: relative;
        outline: none;
        width: 100%;
        display: inline-block;
        color: $mainColor;
        padding: 0.75rem 1rem 0.75rem 1.5rem;
        margin: 0 auto;
        background-color: white;
        border: none;
        border-bottom: 1px solid $mainColor;
        text-align: left;
        -webkit-transition: color 0.3s, background 0.3s;
        -moz-transition: color 0.3s, background 0.3s;
        transition: color 0.3s, background 0.3s;

        &.active {
            color: white;
            background-color: $mainColor;
            cursor: default;
        }

        .icon {
            width: 20px;
            height: auto;
            float: right;
            margin-left: 5px;
        }
    }

    &:last-of-type button.tab-toggle {
        border-bottom-width: 0;
    }
}

</style>
