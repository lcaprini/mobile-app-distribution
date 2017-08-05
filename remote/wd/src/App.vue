<template>
    <div id="app" class="container">
        <div id="header">
            <h2 class="title"> {{ appName }} </h2>
            <app-changelog :builds="builds" @selected="showVersionDetails"></app-changelog>
        </div>
        
        <div class="tabs">

            <div class="versions">
                <version-tab
                    v-for="(build, index) in builds"
                    :key="build.version"
                    :index="index"
                    :id="`v_${index}`"
                    :app-name="appName"
                    :version="build.version"
                    :hidden="build.hidden"
                    :androidLink="build.androidBuildPath"
                    :iosLink="build.iosBuildPath"
                    :active="selectedVersion.version == build.version"
                    @selected="showVersionDetails"></version-tab>
            </div>

            <version-details
                id="main-viewer"
                :app-name="appName"
                :version="selectedVersion.version"
                :hidden="selectedVersion.hidden"
                :changelog="selectedVersion.changelogString"
                :date="selectedVersion.date"
                :androidLink="selectedVersion.androidBuildPath"
                :iosLink="selectedVersion.iosBuildPath"
                class="hidden-xs"></version-details>

        </div>
    
    </div>
</template>

<script>
import Vue from 'vue';
import remove from 'lodash/remove';
import each from 'lodash/each';
import findIndex from 'lodash/findIndex';
import VersionTab from './VersionTab.vue';
import VersionDetails from './VersionDetails.vue';
import Changelog from './Changelog.vue';

export default {
    components:{
        VersionTab : VersionTab,
        VersionDetails : VersionDetails,
        AppChangelog : Changelog
    },
    data(){
        return {
            appName : '',
            builds : [],
            selectedVersion : {}
        }
    },
    created() {
        let App = this;
        const url = window.location.href;
        let showAll = false;
        if(this.getParameterByName(url, 'all')){
            showAll = this.getParameterByName(url, 'all') === 'true';
        }
        const builds = (process.env.NODE_ENV === 'development')? './builds.json' : 'http://fiatpvt-coll.engbms.it/FiatApp/ilcc/wd/builds.json';
        this.$http.get(`${builds}?t=${new Date().getTime()}`).then(
            jsonFile => {
                try{
                    App.appName = jsonFile.body.appName;

                    if(showAll){
                        each(jsonFile.body.builds, b => {
                            b.changelogString = `✓ ${b.changelog.join('<br/>✓ ')}`;
                            App.builds.push(b);
                        });
                    }
                    else{
                        each(jsonFile.body.builds, b => {
                            if(typeof b.hidden === 'undefined' || b.hidden === false){
                                b.changelogString = `✓ ${b.changelog.join('<br/>✓ ')}`;
                                App.builds.push(b);    
                            }
                        });
                    }

                    Vue.nextTick(function () {
                        if(App.builds.length > 0){
                            if(App.getParameterByName(url, 'v')){
                                App.showVersionDetails(findIndex(App.builds, {version : App.getParameterByName(url, 'v')}));
                            }
                            else{
                                App.showVersionDetails(0);
                            }
                        }
                    })

                    document.title = App.appName;
                }
                catch(err){
                    alert(err);
                }
            },
            () => alert('builds.json not found')
        )
    },
    methods : {
        showVersionDetails(versionIndex){
            if(!versionIndex || versionIndex === -1){
                versionIndex = 0;
            }
            this.selectedVersion = this.builds[versionIndex];
            setTimeout(() => {
                document.querySelector(`#v_${versionIndex} .details`).innerHTML = document.querySelector('#main-viewer').innerHTML;
                if(window.innerWidth < 560){
                    const url = window.location.href;
                    location.href = `#v_${versionIndex}`;
                    window.history.replaceState(null, null, url);
                }
            }, 250);
        },
        getParameterByName(url, name) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }
    }
}
</script>

<style lang="sass"> @import "assets/css/main"; </style>

<style lang="sass" scoped>

@import "assets/css/colors";

#header {
    position: relative;
    
    .title {
        text-align: center;
        margin: 10px auto;
        color: $main-color;
        font-size: 20px;
        min-height: 22px;
    }
}

.tabs {
    position: relative;
    min-height: 0;
    overflow: hidden;
    height: 100%;

    @media screen and (min-width: 560px) {
        margin-bottom: 40px;
    }

    .versions {
        height: 100%;
        overflow-y: auto;

        @media screen and (min-width: 560px) {
            width: 30%;
            border-right: 1px solid $main-color;
        }
    }
}

</style>
