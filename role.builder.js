/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

Builder = {
    init: () => {

    },
    isNearConstructionSite: (builder) => {
        if(builder){
            let closestConstructionSite = builder.pos.findClosestByPath(FIND_CONSTRUCTION_SITES)
            if(closestConstructionSite){
                return builder.pos.inRangeTo(closestConstructionSite, 3);
            }
            else{
                //no construction sites
                return false;
            }
        }
        return false;
    },
    isNearSpawn: (builder) => {
        if(builder){
            if(builder.memory.energy_source){
                let assigned_source = Game.getObjectById(builder.memory.enery_source);
                if(assigned_source){
                    return builder.pos.inRangeTo(assigned_source, 1);
                }
                else{
                    //extension has been removed?
                    let closestSpawn = builder.pos.findClosestByPath(FIND_STRUCTURES, {filter: (o) => {
                        return (o.structureType == STRUCTURE_EXTENSION) && o.energy >= 50 && o.my;
                    }})
                    if(closestSpawn){
                        builder.memory.energy_source = closestSpawn.id;
                        return builder.pos.inRangeTo(closestSpawn, 1);
                    }
                    return false
                }
            }
            else{
                let closestSpawn = builder.pos.findClosestByPath(FIND_STRUCTURES, {filter: (o) => {
                    return (o.structureType == STRUCTURE_EXTENSION) && o.energy >= 50 && o.my;
                }})
                if(closestSpawn){
                    builder.memory.energy_source = closestSpawn.id;
                    return builder.pos.inRangeTo(closestSpawn, 1);
                }
                else{
                    let closestSpawn = builder.pos.findClosestByPath(FIND_MY_SPAWNS);
                    return builder.pos.inRangeTo(closestSpawn, 1);
                }
            }
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
                        builder.moveTo(builder.pos.findClosestByPath(FIND_CONSTRUCTION_SITES), {visualizePathStyle: {
                            fill: 'transparent',
                            stroke: '#CE6709',
                            lineStyle: 'dashed',
                            strokeWidth: .05,
                            opacity: .6
                        }});
                    }
                }
                else if(builder_status.state == "BUILDING"){
                    if(builder.carry.energy != 0){
                        let construction_site = builder.pos.findClosestByPath(FIND_CONSTRUCTION_SITES)
                        if(construction_site){
                            let building = builder.build(construction_site);
                            if(building != OK){
                                builder.say("❌ 👷")
                                console.log("Building Failed: "+building);
                                Builder.setNextTask.findEnergy(builder);
                            }
                            else{
                                builder.say("👷")
                            }
                        }
                        else{
                            Builder.setNextTask.findConstructionSite(builder);
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
                        let closestDrop = undefined;
                        if(builder.memory.energy_source){
                            closestDrop = Game.getObjectById(builder.memory.energy_source);
                        }
                        else{
                            closestDrop = builder.pos.findClosestByPath(FIND_STRUCTURES, {filter: (o) => {
                                return (o.structureType == STRUCTURE_EXTENSION || o.structureType == STRUCTURE_SPAWN) && o.energy >= 50 && o.my;
                            }});
                        }
                        builder.moveTo(closestDrop, {visualizePathStyle: {
                            fill: 'transparent',
                            stroke: '#41CBCB',
                            lineStyle: 'dashed',
                            strokeWidth: .05,
                            opacity: .6
                        }});
                    }
                }
                else if(builder_status.state == "WITHDRAWING_ENERGY"){
                    if(builder.carry.energy != builder.carryCapacity){
                        if(Memory.totalAvailableEnergy > 400){ //means we will always be able to create creeps first, builders have lowest priority
                            let withdrawing = undefined;
                            if(builder.memory.energy_source){
                                withdrawing = builder.withdraw(Game.getObjectById(builder.memory.energy_source), RESOURCE_ENERGY);
                            }
                            else{
                                withdrawing = builder.withdraw(builder.pos.findClosestByPath(FIND_STRUCTURES, {filter: (o) => {
                                    return (o.structureType == STRUCTURE_EXTENSION || o.structureType == STRUCTURE_SPAWN) && o.energy > 0;
                                }}), RESOURCE_ENERGY);
                            }
                            if(withdrawing != OK){
                                builder.say("❌ ❇️")
                                console.log("Withdrawing From Spawn Failed: "+withdrawing)
                                Builder.setNextTask.findEnergy(builder);
                            }
                            else{
                                builder.say("❇️")
                            }
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