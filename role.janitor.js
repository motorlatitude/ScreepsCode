/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

let Janitor = {
    findClosestStructure: (janitor) => {
        let towers = _.filter(Game.structures, (o) => {
            return o.structureType == STRUCTURE_TOWER;
        });
        towers = towers.sort((a,b) => {
            return (a.energy/a.energyCapacity) - (b.energyCapacity/b.energyCapacity); 
        });
        for(let t in towers){
            let tower = towers[t];
            if(tower.energy < tower.energyCapacity){
                return tower
            }
        }
        let hit_structures = janitor.room.find(FIND_STRUCTURES, {filter: (o) => {
            return o.structureType == STRUCTURE_RAMPART || o.structureType == STRUCTURE_ROAD || o.structureType == STRUCTURE_WALL
        }})
        hit_structures = hit_structures.sort((a,b) => {
            return (a.hits) - (b.hits);
        });
        for(let i in hit_structures){
            let structure = hit_structures[i];
            if(structure.hits < structure.hitsMax){
                return structure
            }
        }
    },
    findClosestEnergy: (janitor) => {
        if(janitor){
            if(janitor.memory.energy_source){
                let assigned_source = Game.getObjectById(janitor.memory.enery_source);
                if(assigned_source){
                    return assigned_source;
                }
                else{
                    //extension has been removed?
                    let closestSpawn = janitor.pos.findClosestByPath(FIND_STRUCTURES, {filter: (o) => {
                        return (o.structureType == STRUCTURE_EXTENSION) && o.energy >= 50 && o.my;
                    }})
                    if(closestSpawn){
                        janitor.memory.energy_source = closestSpawn.id;
                        return closestSpawn;
                    }
                    else{
                        let closestSpawn = janitor.pos.findClosestByPath(FIND_MY_SPAWNS);
                        return closestSpawn;
                    }
                }
            }
            else{
                let closestSpawn = janitor.pos.findClosestByPath(FIND_STRUCTURES, {filter: (o) => {
                    return (o.structureType == STRUCTURE_EXTENSION) && o.energy >= 50 && o.my;
                }})
                if(closestSpawn){
                    janitor.memory.energy_source = closestSpawn.id;
                    return closestSpawn;
                }
                else{
                    let closestSpawn = janitor.pos.findClosestByPath(FIND_MY_SPAWNS);
                    return closestSpawn;
                }
            }
        }
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
                            strokeWidth: .05,
                            opacity: .6
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
                            strokeWidth: .05,
                            opacity: .6
                        }});
                    }
                }
                else if(janitor_status.state == "WITHDRAWING_ENERGY"){
                    if(janitor.carry.energy != janitor.carryCapacity){
                        if(Memory.totalAvailableEnergy > 400){ //means we will always be able to create creeps first
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
                    if(janitor.energy == 0){
                        Janitor.setNextTask.findEnergy(janitor);
                    }
                    else{
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
                            console.log("Transferring/repairing Using Energy Failed: "+transfer)
                            Janitor.setNextTask.findEnergy(janitor);
                        }
                        else{
                            janitor.say("🛠️")
                        }
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