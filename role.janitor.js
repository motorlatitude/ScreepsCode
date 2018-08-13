/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

let Janitor = {
    findClosestStructure: (janitor) => {
        let hit_structures = janitor.room.find(FIND_STRUCTURES, {filter: (o) => {
            return o.structureType == STRUCTURE_RAMPART || o.structureType == STRUCTURE_ROAD || o.structureType == STRUCTURE_WALL
        }})
        hit_structures = hit_structures.sort((a,b) => {
            return (a.hits/a.hitsMax) - (b.hits/b.hitsMax); 
        });
        for(let i in hit_structures){
            let structure = hit_structures[i];
            if(structure.hits < structure.hitsMax){
                return structure
            }
        }
    },
    findClosestEnergy: (janitor) => {
        return janitor.pos.findClosestByPath(FIND_STRUCTURES, {filter: (o) => {
            return (o.structureType == STRUCTURE_EXTENSION || o.structureType == STRUCTURE_SPAWN) && o.energy >= 50;
        }})
    },
    isNearStructure: (janitor) => {
        if(janitor){
            let closestStructure = Janitor.findClosestStructure(janitor);
            if(closestStructure){
                return janitor.pos.inRangeTo(closestStructure, 1);
            }
            return false;
        }
        return false;
    },
    isNearEnergy: (janitor) => {
        if(janitor){
            let closestStructure = Janitor.findClosestEnergy(janitor);
            if(closestStructure){
                return janitor.pos.inRangeTo(closestStructure, 1);
            }
            return false;
        }
        return false;
    },
    setNextTask: {
        withdrawEnergy: (janitor) => {
            janitor.memory.status = {op: 1, state: "WITHDRAWING_ENERGY"}
        },
        transferToStructure: (janitor) => {
            janitor.memory.status = {op: -1, state: "TRANSFERING_TO_STRUCTURE"}
        },
        findStructure: (janitor) => {
            janitor.memory.status = {op: 2, state: "FINDING_NEAREST_STRUCTURE"}
        },
        findEnergy: (janitor) => {
            janitor.memory.status = {op: 0, state: "FINDING_NEAREST_ENERGY"}
        }
    },
    update: () => {
        let janitors = _.filter(Game.creeps, function(creep){
            return creep.memory.role == 2;
        });
        for(let i in janitors){
            let janitor = janitors[i];
            if(janitor){
                let janitor_status = janitor.memory.status
                if(janitor_status.state == "FINDING_NEAREST_STRUCTURE"){
                    if(Janitor.isNearStructure(janitor)){
                        Janitor.setNextTask.transferToStructure(janitor);
                    }
                    else{
                        janitor.moveTo(Janitor.findClosestStructure(janitor), {visualizePathStyle: {
                            fill: 'transparent',
                            stroke: '#1ED760',
                            lineStyle: 'dashed',
                            strokeWidth: .1,
                            opacity: .3
                        }});
                    }
                }
                else if(janitor_status.state == "FINDING_NEAREST_ENERGY"){
                    if(Janitor.isNearEnergy(janitor)){
                        Janitor.setNextTask.withdrawEnergy(janitor);
                    }
                    else{
                        janitor.moveTo(Janitor.findClosestEnergy(janitor), {visualizePathStyle: {
                            fill: 'transparent',
                            stroke: '#41CBCB',
                            lineStyle: 'dashed',
                            strokeWidth: .1,
                            opacity: .4
                        }});
                    }
                }
                else if(janitor_status.state == "WITHDRAWING_ENERGY"){
                    if(janitor.carry.energy != janitor.carryCapacity){
                        if(Memory.totalAvailableEnergy > 300){ //means we will always be able to create creeps first
                            let withdrawing = janitor.withdraw(Janitor.findClosestEnergy(janitor), RESOURCE_ENERGY)
                            if(withdrawing != OK){
                                janitor.say("❌ ❇️")
                                console.log("Withdrawing From Spawn Failed: "+withdrawing)
                                Janitor.setNextTask.findEnergy(janitor);
                            }
                            else{
                                janitor.say("❇️")
                            }
                        }
                    }
                    else{
                        Janitor.setNextTask.findStructure(janitor)
                    }
                }
                else if(janitor_status.state == "TRANSFERING_TO_STRUCTURE"){
                    let closestStructure = Janitor.findClosestStructure(janitor);
                    let transfer = undefined;
                    if(closestStructure.structureType == STRUCTURE_WALL || closestStructure.structureType == STRUCTURE_RAMPART){
                        transfer = janitor.repair(closestStructure)
                    }
                    else{
                        transfer = janitor.transfer(closestStructure, RESOURCE_ENERGY)
                    }
                    if(transfer != OK){
                        janitor.say("❌ 🛠️")
                        console.log("Transferring/REPAIRING Using Energy Failed: "+transfer)
                        Janitor.setNextTask.findEnergy(janitor);
                    }
                    else{
                        janitor.say("🛠️")
                    }
                }
                else{
                    console.log("Unknown Janitor state: "+janitor_status.state);
                }
            }
        }
    }
}

module.exports = Janitor