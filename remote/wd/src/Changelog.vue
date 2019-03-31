<template>
    <span id="changelog" v-if="builds.length > 0">

        <Button
            type="ghost"
            class="visible-xs"
            shape="circle"
            icon="clipboard"
            @click="changelogModal = true"></Button>

        <Button type="ghost" class="hidden-xs" @click="changelogModal = true"> Changelog </Button>

        <Modal
            v-model="changelogModal"
            title="Changelog"
            class="no-footer body-no-padding"
            :styles="{top: '20px'}">

            <form class="form-inline">
                <Input type="text" class="search" v-model="search" placeholder="Search..."></Input>
                <Button
                    v-if="search != ''"
                    type="ghost"
                    shape="circle"
                    size="small"
                    icon="close-round"
                    @click="search = ''"
                    class="cancel"></Button>
            </form>
            <div class="version-list-container">
                <ul class="version-list">
                    <li v-for="(build, iB) in filteredBuilds" :key="build.version" class="version">
                        <p class="title">
                            <span class="platforms">
                                <Icon v-if="build.iosBuildPath" type="social-apple"></Icon>
                                <Icon v-if="build.androidBuildPath" type="social-android"></Icon>
                                <Icon v-if="build.angularBuildPath" type="social-angular"></Icon>
                            </span>
                            {{ build.version }}
                            <Button
                                type="ghost"
                                shape="circle"
                                size="small"
                                @click="showVersion(iB)"
                                class="select"> Show ▶ </Button>
                        </p>
                        <p class="changelog" v-html="build.changelogString"></p>
                    </li>
                </ul>
            </div>

        </Modal>
    </span>
</template>

<script>
import each from 'lodash/each';

export default {
    data(){
        return {
            changelogModal: false,
            search: ''
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
                const search = this.search.toLowerCase();
                let filtered = [];
                each(this.builds, build => {
                    if(build.changelogString.toLowerCase().indexOf(search) > -1){
                        filtered.push(build);
                    }
                });
                return filtered;
            }
            return this.builds;
        }
    },
    methods: {
        showVersion(version){
            this.changelogModal = false;
            this.$emit('selected', version);
        }
    }
}
</script>

<style lang="sass">

@import 'assets/css/colors';

.search .ivu-input{
    border-radius: 0;
    border: none;
    border-bottom: 1px solid $border-color;
    box-shadow: none;
    padding: 0 20px;
    width: 100%;
    box-shadow: none !important;

    &:hover,
    &:focus {
        border-color: $main-color;
    }
}
.ivu-btn.cancel {
    position: absolute;
    top: 7px;
    right: 15px;
    color: $main-color !important;
    border-color: $main-color !important;
    background-color: transparent !important;
    width: 20px !important;
    height: 20px !important;
    font-size: 13px !important;
}
</style>


<style lang="sass" scoped>
@import 'assets/css/colors';
#changelog {
    position: absolute;
    top: 10px;
    right: 0;
}
form {
    position: relative;
}
div.version-list-container{
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-box-flex: 1;
    -moz-box-flex: 1;
    -webkit-flex: 1;
    -ms-flex: 1;
    flex: 1;
    ul.version-list {
        list-style: none;
        padding: 10px;
        margin-bottom: 0;
        li.version {
            margin-bottom: 5px;
            .title {
                background: $border-color;
                font-size: 14px;
                padding: 5px;
                position: relative;
                padding-left: 75px;
                margin-bottom: 5px;
                .platforms {
                    position: absolute;
                    top: 2px;
                    left: 7px;
                    .ivu-icon {
                        font-size: 25px;
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
                .select {
                    position: absolute;
                    right: 0;
                    top: 3px;
                    font-size: 14px;
                    color: $main-color;
                    border: none;
                }
            }
        }
    }
}
</style>