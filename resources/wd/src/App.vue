<template>
    <div id="app" class="container">
        <h3 id="header"> Applicazione Intercos</h3>
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
                            class="visible-xs-*"></version-details>
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

export default {
    components:{
        VersionTab : VersionTab,
        VersionDetails : VersionDetails
    },
    data(){
        return {
            appName : '',
            builds : [],
            active : null
        }
    },
    beforeCreate() {
        this.$http.get('http://www.eol.unipg.it/builds.json').then(
            jsonFile => {
                try{
                    this.appName = jsonFile.body.appName;
                    this.builds = jsonFile.body.builds;
                    if(this.builds.length > 0){
                        this.active = this.builds[0].version;
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

<style>
    html,
    body {
        height: 100%;
        overflow: hidden;
    }
</style>

<style lang="sass" scoped>

body * {
    font-family: 'Roboto', sans-serif;
}

.container {
    height: 100%;
    -webkit-display : flex;
    display: flex;
    -webkit-flex-direction: column;
    flex-direction: column;

    #header {
        font-size: 15pt;
        text-align: center;
        font-weight: bolder;
        margin-bottom: 20px;
    }

    .tabs {
        position: relative;
        min-height: 0;
        overflow: hidden;
        height: 100%;
        padding-bottom: 40px;
        -webkit-transition: all 0.5s;
        -moz-transition: all 0.5s;
        transition: all 0.5s;

        .versions {
            height: 100%;
            overflow-y: auto;
        }
    }
}

</style>
