<template>
    <span id="changelog">

        <Button type="ghost" @click="changelogModal = true"> Changelog </Button>
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

            <ul class="version-list">
                <transition-group name="version-list" tag="li">
                <li v-for="(build, iB) in filteredBuilds" :key="build.version" class="version">
                    <p class="title">
                        <span class="platforms">
                            <img v-if="build.androidBuildPath" class="icon" :src="androidLogo">
                            <img v-if="build.iosBuildPath" class="icon" :src="iosLogo">
                        </span>
                        {{ build.version }}
                        <Button
                            type="ghost"
                            shape="circle"
                            size="small"
                            @click="showVersion(build.version)"
                            class="select"> Show ▶ </Button>
                    </p>
                    <ul class="changelog">
                        <li v-for="(change, iC) in build.changelog" :key="iC" v-once> {{ change }} </li>
                    </ul>
                </li>
                </transition-group>
            </ul>
            
        </Modal>
    </span>
</template>

<script>
import androidLogo from 'images/androidLogo.png';
import iosLogo from 'images/iosLogo.png';
export default {
    data(){
        return {
            changelogModal: false,
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
                let filtered = [];
                _.each(this.builds, build => {
                    let found = false;
                    let changeCounter = 0;
                    while(!found && changeCounter < build.changelog.length){
                        if(_.lowerCase(build.changelog[0]).indexOf(_.lowerCase(search)) > -1){
                            found = true;
                        }
                        changeCounter++;
                    }
                    if(found){
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

.version-list-enter-active, .version-list-leave-active {
    transition: all 0.25s;
}
.version-list-enter, .version-list-leave-to /* .version-list-leave-active for <2.1.8 */ {
    opacity: 0;
}

#changelog {
    position: absolute;
    top: 10px;
    right: 0;
}

form {
    position: relative;
}

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
            padding-left: 50px;
            margin-bottom: 5px;

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
                top: 3px;
                font-size: 14px;
                color: $main-color;
                border: none;
            }
        }
    }
}

</style>