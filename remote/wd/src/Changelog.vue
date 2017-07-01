<template>
    <span id="changelog">
        
        <button class="btn btn-default changelog-button" data-toggle="modal" data-target="#changelogModal" >Changelog</button>

        <div id="changelogModal" class="changelog-modal modal fade" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title"> Changelog </h4>
                    </div>
                    <div class="modal-body">

                        <form class="form-inline">
                            <input type="search" class="form-control search" v-model="search" placeholder="Search...">
                        </form>

                        <ul class="version-list">
                            <transition-group name="version-list" tag="li">
                            <li v-for="(build, iB) in filteredBuilds" :key="build.version" class="version">
                                <p class="title" v-once>
                                    <span class="platforms">
                                        <img v-if="build.androidBuildPath" class="icon" :src="androidLogo">
                                        <img v-if="build.iosBuildPath" class="icon" :src="iosLogo">
                                    </span>
                                    {{ build.version }}
                                    <button class="btn btn-link select" @click="showVersion(build.version)"
                                            data-toggle="modal"
                                            data-target="#changelogModal"> Show ▶ </button>
                                </p>
                                <ul class="change-list">
                                    <li v-for="(change, iC) in build.changelog" :key="iC" class="change" v-once> {{ change }} </li>
                                </ul>
                            </li>
                            </transition-group>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </span>
</template>

<script>
import androidLogo from 'images/androidLogo.png';
import iosLogo from 'images/iosLogo.png';
export default {
    data(){
        return {
            search: '',
            androidLogo :androidLogo,
            iosLogo :iosLogo
        }
    },
    props: {
        builds : {
            type : Array,
            default : []
        }
    },
    computed: {
        filteredBuilds(){
            if(this.search){
                const search = this.search;
                let filter = _.filter(this.builds, build => {
                    let found = false;
                    let changeCounter = 0;
                    while(!found && changeCounter < build.changelog.length){
                        if(_.lowerCase(build.changelog[0]).indexOf(_.lowerCase(search)) > -1){
                            found = true;
                        }
                        changeCounter++;
                    }
                    return found;
                });
                return filter;
            }
            return this.builds;
        }
    },
    methods: {
        showVersion(version){
            this.$emit('selected', version);
        }
    }
}
</script>

<style lang="sass" scoped>

@import 'assets/css/colors';

.version-list-enter-active, .version-list-leave-active {
    transition: all 0.25s;
}
.version-list-enter, .version-list-leave-to /* .version-list-leave-active for <2.1.8 */ {
    opacity: 0;
}

.changelog-modal {
    overflow: hidden !important;

    .modal-dialog {
        max-height: 93%;
        display: -webkit-box;
        display: -moz-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
        -webkit-flex-direction: column;
        flex-direction: column;

        .modal-content {
            display: -webkit-box;
            display: -moz-box;
            display: -ms-flexbox;
            display: -webkit-flex;
            display: flex;
            -webkit-flex-direction: column;
            flex-direction: column;

            .modal-body {
                overflow-x: hidden;
                overflow-y: auto;
            }
        }
    }
}

#changelog {
    position: absolute;
    top: 10px;
    right: 0;

    .changelog-button {
        border: 1px solid $mainColor;
        border-radius: 0;
    }

    .changelog-modal {
        .modal-header {
            text-align: center;
        }
        .modal-body {
            padding: 0;

            .search{
                border-radius: 0;
                border: none;
                border-bottom: 1px solid #e4e4e4;
                box-shadow: none;
                padding: 0 20px;
                width: 100%;
            }

            ul.version-list {
                list-style: none;
                padding: 10px;
                margin-bottom: 0;

                li.version {

                    .title {
                        background: #e4e4e4;
                        font-size: 16px;
                        padding: 5px;
                        margin: 5px;
                        position: relative;
                        padding-left: 50px;

                        .platforms {
                            position: absolute;
                            left: 0;
                            padding-left: 5px;

                            .icon {
                                width: 20px;
                                position: relative;
                                top: -2px;
                            }
                        }

                        .select {
                            position: absolute;
                            right: 0;
                            top: 0;
                            font-size: 14px;
                            color: $mainColor;
                        }
                    }
                    
                    ul.change-list {
                        list-style-type: none;
                        padding-left: 30px;

                        @media screen and (max-width: 768px) {
                            padding-left: 20px;
                        }

                        li.change {
                            position: relative;
                            padding-left: 15px;

                            &:before {
                                content: '✓';
                                position: absolute;
                                left: 0px;
                            }
                        }
                    }
                }
            }
        }
    }
}

</style>