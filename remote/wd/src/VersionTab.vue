<template>
    <div>
        <div class="tab">
            <button class="tab-toggle" :class="{active : active}" @click="select">
                {{version}}
                <div class="platforms">
                    <i class="ivu-icon ivu-icon-social-apple" v-if="iosLink"></i>
                    <i class="ivu-icon ivu-icon-social-android" v-if="androidLink"></i>
                    <i class="ivu-icon ivu-icon-social-angular" v-if="angularLink"></i>
                </div>
            </button>
        </div>
        <version-details
            id="main-viewer"
            :app-name="appName"
            :version="version"
            :hidden="hidden"
            :changelog="changelog"
            :date="date"
            :androidLink="androidLink"
            :iosLink="iosLink"
            :angularLink="angularLink"
            class="details visible visible-xs"
            v-if="active"
        ></version-details>
    </div>
</template>
<script>
import VersionDetails from './VersionDetails.vue';

export default {
    components: {
        VersionDetails: VersionDetails,
    },
    props: {
        appName: {
            type: String,
            required: true,
        },
        index: {
            type: Number,
        },
        version: {
            type: String,
            required: true,
        },
        hidden: {
            type: Boolean,
            default: false,
        },
        changelog: {
            type: String,
            required: true,
        },
        date: {
            type: String,
            default: '',
        },
        androidLink: {
            type: String,
            default: null,
        },
        iosLink: {
            type: String,
            default: null,
        },
        angularLink: {
            type: String,
            default: null,
        },
        active: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        select($event) {
            this.$emit('selected', this.index);
        },
    },
};
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

        @media screen and (max-width: 559px) {
            border-top: 1px solid $main-color;
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
            .ivu-icon-social-angular {
                color: $angular-color;
            }
        }
    }
}

</style>
