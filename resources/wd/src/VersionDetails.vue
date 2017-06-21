<template>
    <div class="details" :class="{visible : visible}">
        <h2> {{ appName }} v.{{ version }} </h2>
        <div class="row">
            <div class="bold changelogLabel col-xs-12 col-sm-2">Changelog</div>
            <div class="changelogText col-xs-9">
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
                :href="'itms-services://?action=download-manifest&amp;url='+iosLink"> Download IPA </a>
            <a v-if="androidLink"
                class="btn col-xs-12 col-sm-4 btn-android"
                :class="iosLink? 'col-sm-offset-2' : 'col-sm-offset-4'"
                :href="androidLink"> Download APK </a>
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
    }
}
</script>
<style lang="sass" scoped>

$tabColor: #374d72;

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
    &.visible {
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
    
    h2 {
        color: $tabColor;
        font-weight: bold;
        text-align: center;
        font-size: 16pt;
        margin-top: 10px;
        margin-bottom: 15px;
    }

    .row {
        margin-top: 20px;
    }

    .bold {
        font-weight: bold;
    }

    @media only screen and (max-width: 767px){
        
        .changelogText {
            width: 91%;
            float: right;
            margin-top: 10px;

            ul {
                padding-left: 15px;
            }
        }
        .downloaders {
            margin-bottom: 20px;
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
