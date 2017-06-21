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

$tabColor: #374d72;
$tabColorArrow: #8099c2;

.tab {

    @media screen and (min-width: 35rem) {
        float: left;
        clear: left;
        width: 30%;
    }

    .tab-toggle {
        padding: 1rem 4rem 1rem 2rem;
        position: relative;
        outline: none;
        width: 100%;
        display: inline-block;
        color: $tabColor;
        padding: 0.75rem 2rem;
        margin: 0 auto;
        background-color: white;
        border: 1px solid $tabColor;
        font-weight: bold;
        text-align: left;
        -webkit-transition: all 0.3s;
        -moz-transition: all 0.3s;
        transition: all 0.3s;

        &:after {
            content: "\25BC";
            position: absolute;
            display: block;
            right: 2rem;
            top: 50%;
            -webkit-transform: rotate(0deg) translateY(-50%);
            -moz-transform: rotate(0deg) translateY(-50%);
            -ms-transform: rotate(0deg) translateY(-50%);
            -o-transform: rotate(0deg) translateY(-50%);
            transform: rotate(0deg) translateY(-50%);

            @media screen and (min-width: 35rem) {
                -webkit-transform: rotate(-90deg) translateX(50%);
                -moz-transform: rotate(-90deg) translateX(50%);
                -ms-transform: rotate(-90deg) translateX(50%);
                -o-transform: rotate(-90deg) translateX(50%);
                transform: rotate(-90deg) translateX(50%);
            }
        }

        &.active {
            color: white;
            background-color: $tabColor;
            cursor: default;

            &:after {
                color: $tabColorArrow;
                -webkit-transform: rotate(180deg) translateY(50%);
                -moz-transform: rotate(180deg) translateY(50%);
                -ms-transform: rotate(180deg) translateY(50%);
                -o-transform: rotate(180deg) translateY(50%);
                transform: rotate(180deg) translateY(50%);

                @media screen and (min-width: 35rem) {
                    -webkit-transform: rotate(-90deg) translateX(50%) translateY(0);
                    -moz-transform: rotate(-90deg) translateX(50%) translateY(0);
                    -ms-transform: rotate(-90deg) translateX(50%) translateY(0);
                    -o-transform: rotate(-90deg) translateX(50%) translateY(0);
                    transform: rotate(-90deg) translateX(50%) translateY(0);
                    right: 1rem;
                }
            }
        }

        .icon {
            width: 20px;
            height: auto;
            float: right;
            position: relative;
            top: -1px;
            right: 25px;
            margin-left: 5px;
        }
    }
}

.details {
    margin-bottom: 1px;
    max-height: 0;
    overflow: hidden;
    padding: 0 2rem;
    background-color: #efefef;
    -webkit-transition: all 0.5s;
    -moz-transition: all 0.5s;
    transition: all 0.5s;

    @media screen and (min-width: 35rem) {
        max-height: none;
        position: absolute;
        right: 0;
        top: 0;
        width: 70%;
        opacity: 0;
        padding: 0rem 2rem 2rem 2rem;
        //@include transform(translateX(100%));
    }
    &.active {
        max-height: 1000px;
        -webkit-transition: all 2s;
        -moz-transition: all 2s;
        transition: all 2s;

        @media screen and (min-width: 35rem) {
            max-height: none;
            opacity: 1;
            -webkit-transform: none;
            -moz-transform: none;
            -ms-transform: none;
            -o-transform: none;
            transform: none;
        }
    }
    > .heading {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }
}

</style>
