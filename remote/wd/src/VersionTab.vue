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

@import "assets/css/main";

.tab {

    .tab-toggle {
        outline: none;
        width: 100%;
        color: $main-color;
        padding: 12px 16px;
        font-size: 13px;
        font-weight: 500;
        background-color: white;
        border: none;
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        text-align: left;
        -webkit-transition: color 0.3s, background 0.3s;
        -moz-transition: color 0.3s, background 0.3s;
        transition: color 0.3s, background 0.3s;

        @media screen and (max-width: 560px) {
            border: 1px solid $main-color;
            border-bottom-width: 0;
            border-radius: 0;
        }

        &.active {
            color: white;
            background-color: $main-color;
            cursor: default;
        }

        .icon {
            width: 20px;
            height: auto;
            float: right;
            margin-left: 5px;
        }
    }

    &:nth-last-child(2) {
        @media screen and (max-width: 560px) {
            border-bottom: 1px solid $main-color;
        }
    }
}

</style>
