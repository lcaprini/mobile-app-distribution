<template>
    <div class="tab">
        <button class="tab-toggle" :class="{active : active}" @click="select">
            {{version}}
            <div class="platforms">
                <Icon v-if="iosLink" type="social-apple"></Icon>
                <Icon v-if="androidLink" type="social-android"></Icon>
            </div>
        </button>
    </div>
</template>
<script>

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
        position: relative;
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

            .platforms .ivu-icon {
                color: white;
            }
        }

        .platforms {
            position: absolute;
            top: 5px;
            right: 5px;

            .ivu-icon {
                font-size: 30px;
                margin-left: 5px;
            }

            .ivu-icon-social-apple {
                color: $ios-color;
            }
            .ivu-icon-social-android {
                color: $android-color;
            }
        }
    }

    &:nth-last-child(2) {
        @media screen and (max-width: 560px) {
            border-bottom: 1px solid $main-color;
        }
    }
}

</style>
