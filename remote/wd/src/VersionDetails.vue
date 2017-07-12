<template>
    <div class="details" :class="{visible : visible}">
        <h3> {{ appName }} v.{{ version }} </h3>

        <Row>
            <Col :xs="24" :sm="5"> Changelog </Col>
            <Col class="changelogText" :xs="24" :sm="18">
                <ul class="changelog">
                    <li v-for="(log, index) in changelog" :key="index"> {{ log }} </li>
                </ul>
            </Col>
        </Row>

        <Row>
            <Col :xs="8" :sm="5"> Release date </Col>
            <Col :xs="16" :sm="19"> {{ date }} </Col>
        </Row>
        
        <Row class="downloader" type="flex" justify="space-around">
            <Col :xs="24" :sm="8" v-if="iosLink">
                <Button class="ios" long @click="downloadIPA"> Download IPA </Button>
            </Col>
            <Col :xs="24" :sm="8" v-if="androidLink">
                <Button class="android" long @click="downloadAPK"> Download APK </Button>
            </Col>
        </Row>
    </div>
</template>
<script>

export default {
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
        changelog: {
            type: Array,
            default: []
        },
        date: {
            type: String,
            default: null
        },
        androidLink: {
            type: String,
            default: null
        },
        iosLink: {
            type: String,
            default: null
        },
        visible : {
            type: Boolean,
            default: false
        }
    },
    methods: {
        downloadIPA(){
            const link = (this.iosLink.indexOf('itms-services') === -1)? `itms-services://?action=download-manifest&amp;url=${this.iosLink}` : this.iosLink;
            console.log('Download IPA', link);
            window.open(link, '_self');
        },
        downloadAPK(){
            const link = this.androidLink;
            console.log('Download APK', link);
            window.open(link, '_self');
        }
    }
}
</script>
<style lang="sass" scoped>

@import "assets/css/colors";

.details {
    max-height: 0;
    overflow: auto;
    padding: 0 16px;
    -webkit-transition: max-height 0.5s, opacity 0.5s;
    -moz-transition: max-height 0.5s, opacity 0.5s;
    transition: max-height 0.5s, opacity 0.5s;
    z-index: -1;
    border-left: 1px solid $main-color;
    border-right: 1px solid $main-color;

    @media screen and (min-width: 560px) {
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
        .downloader {
            .ivu-col:not(:first-of-type){
                margin-top: 10px;
            }
        }
    }
    &.visible-xs.visible:last-of-type {
        border-bottom: 1px solid $main-color;
    }
}

</style>