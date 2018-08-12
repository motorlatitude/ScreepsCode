/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

Builder = {
    init: () => {

    },
    isNearConstructionSite: (builder) => {
        if(builder){
            let closestConstructionSite = builder.pos.findClosestByPath(FIND_CONSTRUCTION_SITES)
            return builder.pos.inRangeTo(closestConstructionSite, 3);
        }
        return false;
    },
    isNearSpawn: (builder) => {
        if(builder){
            let closestSpawn = builder.pos.findClosestByPath(FIND_MY_SPAWNS)
            return builder.pos.inRangeTo(closestSpawn, 1);
        }
        return false;
    },
    setNextTask: {
        findConstructionSite: (builder) => {
            builder.memory.status = {op: 0, state: "FINDING_NEAR_CONSTRUCTION_SITE"};
        },
        findEnergy: (builder) => {
            builder.memory.status = {op: 1, state: "FINDING_NEAREST_ENERGY"};
        },
        withdrawEnergy: (builder) => {
            builder.memory.status = {op: 2, state: "WITHDRAWING_ENERGY"};
        },
        build: (builder) => {
            builder.memory.status = {op: -1, state: "BUILDING"};   
        }
    },
    update: () => {
        let builders = _.filter(Game.creeps, function(creep){
            return creep.memory.role == 1;
        });
        for(let i in builders){
            let builder = builders[i];
            if(builder){
                let builder_status = builder.memory.status
                if(builder_status.state == "FINDING_NEAR_CONSTRUCTION_SITE"){
                    if(Builder.isNearConstructionSite(builder)){
                        Builder.setNextTask.build(builder);
                    }
                    else{
                        builder.moveTo(builder.pos.findClosestByPath(FIND_CONSTRUCTION_SITES))
                    }
                }
                else if(builder_status.state == "BUILDING"){
                    if(builder.carry.energy != 0){
                        let building = builder.build(builder.pos.findClosestByPath(FIND_CONSTRUCTION_SITES));
                        if(building != OK){
                            builder.say("❌ 👷")
                            console.log("Building Failed: "+building);
                        }
                        else{
                            builder.say("👷")
                        }
                    }
                    else{
                        Builder.setNextTask.findEnergy(builder)
                    }
                }
                else if(builder_status.state == "FINDING_NEAREST_ENERGY"){
                    if(Builder.isNearSpawn(builder)){
                        Builder.setNextTask.withdrawEnergy(builder);
                    }
                    else{
                        builder.moveTo(builder.pos.findClosestByPath(FIND_MY_SPAWNS))
                    }
                }
                else if(builder_status.state == "WITHDRAWING_ENERGY"){
                    if(builder.carry.energy != builder.carryCapacity){
                        let withdrawing = builder.withdraw(builder.pos.findClosestByPath(FIND_MY_SPAWNS), RESOURCE_ENERGY);
                        if(withdrawing != OK){
                            builder.say("❌ ❇️")
                            console.log("Withdrawing From Spawn Failed: "+withdrawing)
                        }
                        else{
                            builder.say("❇️")
                        }
                    }
                    else{
                        Builder.setNextTask.findConstructionSite(builder)
                    }
                }
                else{
                    console.log("unknown builder_status: "+builder_status);
                }
            }
        }
    }
}

module.exports = Builder;