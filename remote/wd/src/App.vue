<template>
    <div id="app" class="container">
        <Spin size="large" fix v-if="!ready">
            <Icon type="load-c" size="18" class="demo-spin-icon-load"></Icon>
            <div>Loading</div>
        </Spin>

        <div id="header">
            <h2 class="title">{{ appName }}</h2>
            <app-changelog :builds="builds" @selected="showVersionDetails"></app-changelog>
        </div>

        <div class="tabs">
            <div class="versions" :class="{'no-builds': ready && builds.length === 0}">
                <Card v-if="ready && builds.length === 0" class="no-builds">
                    <div>
                        <Icon type="sad-outline" size="28"></Icon>
                        <h3>No builds available</h3>
                    </div>
                </Card>

                <version-tab
                    v-for="(build, index) in builds"
                    :key="build.version"
                    :index="index"
                    :id="`v_${index}`"
                    :app-name="appName"
                    :version="build.version"
                    :hidden="build.hidden"
                    :changelog="build.changelogString"
                    :date="build.date"
                    :androidLink="build.androidBuildPath"
                    :iosLink="build.iosBuildPath"
                    :angularLink="build.angularBuildPath"
                    :active="selectedVersion.version == build.version"
                    @selected="showVersionDetails"
                ></version-tab>
            </div>

            <version-details
                id="main-viewer"
                v-if="ready && builds.length > 0"
                :app-name="appName"
                :version="selectedVersion.version"
                :hidden="selectedVersion.hidden"
                :changelog="selectedVersion.changelogString"
                :date="selectedVersion.date"
                :androidLink="selectedVersion.androidBuildPath"
                :iosLink="selectedVersion.iosBuildPath"
                :angularLink="selectedVersion.angularBuildPath"
                v-show="ready"
                class="hidden-xs"
            ></version-details>
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
    components: {
        VersionTab: VersionTab,
        VersionDetails: VersionDetails,
        AppChangelog: Changelog,
    },
    data() {
        return {
            appName: '',
            builds: [],
            selectedVersion: {},
            ready: false,
        };
    },
    created() {
        let App = this;
        const url = window.location.href;
        let showAll = false;
        if (this.getParameterByName(url, 'all')) {
            showAll = this.getParameterByName(url, 'all') === 'true';
        }
        // const builds = (process.env.NODE_ENV === 'production')? './builds.json' : 'http://fiatpvt-coll.engbms.it/FiatApp/ilcc/wd/builds.json';
        const builds = './builds.json';
        this.$http.get(`${builds}?t=${new Date().getTime()}`).then(
            jsonFile => {
                try {
                    App.appName = jsonFile.body.appName;

                    if (showAll) {
                        each(jsonFile.body.builds, b => {
                            b.changelogString = `✓ ${b.changelog.join(
                                '<br/>✓ ',
                            )}`;
                            App.builds.push(b);
                        });
                    } else {
                        each(jsonFile.body.builds, b => {
                            if (
                                typeof b.hidden === 'undefined' ||
                                b.hidden === false
                            ) {
                                b.changelogString = `✓ ${b.changelog.join(
                                    '<br/>✓ ',
                                )}`;
                                App.builds.push(b);
                            }
                        });
                    }

                    Vue.nextTick(function() {
                        if (App.builds.length > 0) {
                            if (App.getParameterByName(url, 'v')) {
                                App.showVersionDetails(
                                    findIndex(App.builds, {
                                        version: App.getParameterByName(
                                            url,
                                            'v',
                                        ),
                                    }),
                                );
                            } else {
                                App.showVersionDetails(0);
                            }
                        }
                        App.ready = true;
                    });

                    document.title = App.appName;
                } catch (err) {
                    alert(err);
                }
            },
            () => alert('builds.json not found'),
        );
    },
    methods: {
        showVersionDetails(versionIndex) {
            if (!versionIndex || versionIndex === -1) {
                versionIndex = 0;
            }
            this.selectedVersion = this.builds[versionIndex];
            if (window.innerWidth < 560) {
                const App = this;
                setTimeout(() => {
                    const options = {
                        container: '.versions',
                        easing: 'ease-in',
                        offset: -50,
                    };
                    App.$scrollTo(`#v_${versionIndex}`, 300, options);
                }, 250);
            }
        },
        getParameterByName(url, name) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, '\\$&');
            var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        },
    },
};
</script>

<style lang="sass">
@import "assets/css/main";
@import "assets/css/colors";

.demo-spin-icon-load{
    animation: ani-demo-spin 1s linear infinite;
}

@keyframes ani-demo-spin {
    from { transform: rotate(0deg);}
    50%  { transform: rotate(180deg);}
    to   { transform: rotate(360deg);}
}

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
    margin-bottom: 40px;

    @media screen and (max-width: 559px) {
        margin-bottom: 20px;
    }

    .versions {
        height: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;

        &:not(.no-builds){

            @media screen and (min-width: 560px) {
                width: 30%;
                border-right: 1px solid $main-color;
            }

            @media screen and (max-width: 559px) {
                margin-bottom: 20px;
                border: 1px solid $main-color;

                & > div:first-of-type .tab .tab-toggle {
                    border-top: none;
                }
            }
        }

        .no-builds {
            text-align: center;
            color: #5fa8f3;
            width: 320px;
            margin: 100px auto;
        }
    }
}

</style>
