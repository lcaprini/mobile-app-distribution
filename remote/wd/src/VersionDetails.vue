<template>
    <div class="details visible">
        <h3>{{ appName }} v.{{ version }}</h3>

        <div class="ivu-row">
            <div class="ivu-col ivu-col-span-xs-24 ivu-col-span-sm-5">Changelog</div>
            <div class="ivu-col ivu-col-span-xs-24 ivu-col-span-sm-18 changelogText">
                <p class="changelog" v-html="changelog"></p>
            </div>
        </div>

        <div class="ivu-row">
            <div class="ivu-col ivu-col-span-xs-8 ivu-col-span-sm-5">Release date</div>
            <div class="ivu-col ivu-col-span-xs-16 ivu-col-span-sm-19">{{ date }}</div>
        </div>

        <div class="ivu-row ivu-row-flex ivu-row-flex-space-around downloader">
            <div
                class="ivu-col ivu-col-span-xs-24 ivu-col-span-sm-7 ivu-col-span-sm-8"
                v-if="iosLink"
            >
                <button
                    type="button"
                    class="ivu-btn ivu-btn-long ios"
                    :link="iosLink"
                    @click="downloadIPA"
                >Download IPA</button>
            </div>
            <div
                class="ivu-col ivu-col-span-xs-24 ivu-col-span-sm-7 ivu-col-span-lg-8"
                v-if="androidLink"
            >
                <button
                    type="button"
                    class="ivu-btn ivu-btn-long android"
                    :link="androidLink"
                    @click="downloadAPK"
                >Download APK</button>
            </div>
            <div
                class="ivu-col ivu-col-span-xs-24 ivu-col-span-sm-7 ivu-col-span-lg-8"
                v-if="angularLink"
            >
                <button
                    type="button"
                    class="ivu-btn ivu-btn-long angular"
                    :link="angularLink"
                    @click="downloadNgPkg"
                >Download Angular</button>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        appName: {
            type: String,
            default: '',
        },
        version: {
            type: String,
            default: '',
        },
        hidden: {
            type: Boolean,
            default: false,
        },
        changelog: {
            type: String,
            default: '',
        },
        date: {
            type: String,
            default: null,
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
    },
    methods: {
        downloadIPA() {
            const link =
                this.iosLink.indexOf('itms-services') === -1
                    ? `itms-services://?action=download-manifest&amp;url=${this.iosLink}`
                    : this.iosLink;
            this._download(link, 'Download IPA');
        },
        downloadAPK() {
            this._download(this.androidLink, 'Download APK');
        },
        downloadNgPkg() {
            this._download(this.angularLink, 'Download Angular');
        },

        _download(link, logText) {
            console.log(logText, link);
            window.open(link, '_self');
        },
    },
};
</script>
<style lang="sass">

@import "assets/css/colors";

.details {
    max-height: 0;
    overflow: auto;
    padding: 0 16px;
    z-index: -1;

    @media screen and (min-width: 559px) {
        max-height: none;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        width: 70%;
        opacity: 0;
        padding-top: 16px;
        padding-bottom: 16px;
        border: none;

        &.visible {
            max-height: none;
            opacity: 1;
        }
    }

    &.visible {
        max-height: 1000px;
        z-index: 10;
        padding: 16px;
    }

    h3 {
        color: $main-color;
        text-align: center;
        font-size: 16px;
    }

    .ivu-row {
        margin: 30px 0;
    }

    @media screen and (max-width: 767px) {
        .changelog {
            padding-left: 10px;
        }
    }

    @media screen and (max-width: 767px) {
        .downloader {
            .ivu-col:not(:first-of-type){
                margin-top: 10px;
            }
        }
    }

}

</style>