<template>
    <div id="app" class="container">
        <div id="header">
            <h2 class="title"> {{ appName }} </h2>
            <app-changelog :builds="builds" @selected="selectedVersion"></app-changelog>
        </div>
        
        <div class="tabs">

            <div class="versions">
                <template v-for="(build, index) in builds">
                    <version-tab
                        :app-name="appName"
                        :version="build.version"
                        :hidden="build.hidden"
                        :androidLink="build.androidBuildPath"
                        :iosLink="build.iosBuildPath"
                        :active="active == build.version"
                        @selected="selectedVersion"></version-tab>

                        <version-details
                            :app-name="appName"
                            :version="build.version"
                            :hidden="build.hidden"
                            :changelog="build.changelog"
                            :date="build.date"
                            :androidLink="build.androidBuildPath"
                            :iosLink="build.iosBuildPath"
                            :visible="active == build.version"
                            class="visible-xs"></version-details>
                </template>
            </div>

            <version-details
                v-for="(build, index) in builds" :key="build.version"
                :app-name="appName"
                :version="build.version"
                :hidden="build.hidden"
                :changelog="build.changelog"
                :date="build.date"
                :androidLink="build.androidBuildPath"
                :iosLink="build.iosBuildPath"
                :visible="active == build.version"
                class="hidden-xs"></version-details>

        </div>
    
    </div>
</template>

<script>
import $ from 'jquery';
import _ from 'lodash';
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
            active : null
        }
    },
    beforeCreate() {
        const url = new URL(window.location.href);
        let showAll = false;
        if(url.searchParams.get('all')){
            showAll = url.searchParams.get('all') === 'true';
        }
        const builds = (process.env.NODE_ENV === 'production')? './builds.json' : 'http://www.eol.unipg.it/builds.json';
        this.$http.get(`${builds}?t=${new Date().getTime()}`).then(
            jsonFile => {
                try{
                    this.appName = jsonFile.body.appName;

                    this.builds = (showAll)? jsonFile.body.builds : _.remove(jsonFile.body.builds, {hidden : false});

                    if(this.builds.length > 0){
                        if(url.searchParams.get('v')){
                            this.active = url.searchParams.get('v');
                        }
                        else{
                            this.active = this.builds[0].version;
                        }
                    }

                    document.title = this.appName;
                }
                catch(err){
                    alert(err);
                }
            },
            () => alert('builds.json not found')
        )
    },
    methods : {
        selectedVersion(version){
            this.active = version;
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
    -webkit-transition: all 0.5s;
    -moz-transition: all 0.5s;
    transition: all 0.5s;

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
