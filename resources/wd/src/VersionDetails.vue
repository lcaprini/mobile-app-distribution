<template>
    <div class="details" :class="{visible : visible}">
        <h2> {{ appName }} v.{{ version }} </h2>
        <div class="row">
            <div class="bold changelogLabel col-xs-12 col-sm-2">Changelog</div>
            <div class="changelogText col-xs-12 col-sm-9 pull-right">
                <ul>
                    <li v-for="log in changelog"> {{ log }} </li>
                </ul>
            </div>
        </div>
        <div class="row">
            <div class="bold changelogLabel col-xs-12 col-sm-3">Release date</div>
            <div class="col-xs-8"> {{ date }} </div>
        </div>
        <div class="row downloaders">
            
            <a v-if="iosLink"
                class="btn col-xs-12 col-sm-4 btn-ios"
                :class="androidLink? 'col-sm-offset-1' : 'col-sm-offset-4'"
                :href="'itms-services://?action=download-manifest&amp;url='+iosLink"
                v-qr-code-tooltip data-toggle="tooltip" :title="`<img src='https://chart.googleapis.com/chart?cht=qr&chs=300x300&choe=UTF-8&chld=H|0&chl=${iosLink}'/>`"> Download IPA </a>

            <a v-if="androidLink"
                class="btn col-xs-12 col-sm-4 btn-android"
                :class="iosLink? 'col-sm-offset-2' : 'col-sm-offset-4'"
                :href="androidLink"
                v-qr-code-tooltip data-toggle="tooltip" :title="`<img src='https://chart.googleapis.com/chart?cht=qr&chs=300x300&choe=UTF-8&chld=H|0&chl=${androidLink}'/>`"> Download APK </a>

        </div>
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
    directives : {
        qrCodeTooltip : {
            // bind(el){
            //     $(el).tooltip({
            //         animated: 'fade',
            //         placement: 'bottom',
            //         html: true,
            //         delay: { "hide": 250 }
            //     });
            // }
        }
    }
}
</script>
<style lang="sass" scoped>

@import "assets/css/colors";

.details {
    max-height: 0;
    overflow: auto;
    padding: 0 2rem;
    -webkit-transition: max-height 0.5s, opacity 0.5s;
    -moz-transition: max-height 0.5s, opacity 0.5s;
    transition: max-height 0.5s, opacity 0.5s;
    z-index: -1;

    @media screen and (min-width: 35rem) {
        max-height: none;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        width: 70%;
        opacity: 0;
        padding: 1rem 2rem;
    }
    &.visible {
        max-height: 1000px;
        z-index: 10;

        &.visible-xs {
            border-bottom: 1px solid $mainColor;
        }

        @media screen and (min-width: 35rem) {
            max-height: none;
            opacity: 1;
        }
    }
    
    h2 {
        color: $mainColor;
        font-weight: bold;
        text-align: center;
        font-size: 16pt;
        margin: 20px;
    }

    .row {
        margin: 20px 0;
    }

    .bold {
        font-weight: bold;
    }

    .changelogText {
        min-height: 130px;
        border: 1px solid #bdbdbd;
        padding: 5px 10px;

        ul {
            padding-left: 15px;
        }
    }

    @media only screen and (max-width: 767px){
        
        .changelogText {
            margin-top: 10px;
            border: none;
        }
        .downloaders {
            margin: 20px;

            .tooltip-inner {
                max-width: 1000px;
            }
        }
    }

    .btn {
        margin-top: 10px;
    }

    .btn-ios {
        background: #3498db;
        font-weight: bold;
        color: white;
        border-radius: 0px;
    }

    .btn-android {
        background: #9c0;
        font-weight: bold;
        color: white;
        border-radius: 0px;
    }
}

</style>
<style lang="sass">
    .downloaders {
        .tooltip {

            @media screen and (max-width: 35rem) {
                display: none !important;
            }

            .tooltip-inner {
                max-width: 1000px;
            }
        }
    }
</style>
