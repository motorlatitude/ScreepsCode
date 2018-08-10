/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

Harvester = {
    init: () => {
        if(!Memory.sourceQueue){
            Memory.sourceQueue = {}
        }
        let allEnergySources = Game.spawns["Spawn1"].room.find(FIND_SOURCES)
        for(let i in allEnergySources){
            let energy_source = allEnergySources[i];
            if(!Memory.sourceQueue[energy_source.id]){
                Memory.sourceQueue[energy_source.id] = {queued_creeps: [], source: energy_source};
            }
        }
    },
    isNearEnergySource: (harvester_creep) => {
        if(harvester_creep != null){
            let nearestEnergySource = harvester_creep.pos.findClosestByPath(FIND_SOURCES);
            if(nearestEnergySource){
                return harvester_creep.pos.inRangeTo(nearestEnergySource.pos,1);
            }
            return false;
        }
        return false;
        
    },
    isNearEnergyDrop: (creep) => {
        let nearestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS)
        //check if nearest spawn is full of energy;
        if(nearestSpawn.energy >= nearestSpawn.energyCapacity){
            let nearestController = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTROLLER;
            }})
            return {isNear: creep.pos.inRangeTo(nearestController.pos,3), structure: nearestController};
        }
        else{
            return {isNear: creep.pos.inRangeTo(nearestSpawn.pos, 1), structure: nearestSpawn};
        }
    },
    setNextTask: {
        keepHarvesting: (creep) => {
            let harvesting = creep.harvest(creep.pos.findClosestByPath(FIND_SOURCES));
            if(harvesting != OK){
                creep.say("❌ ⛏️");
                console.log("Error Occurred Attempting To Mine Energy: "+harvesting)
            }
            else{
                creep.say("⛏️");
                creep.memory.status = {op: -1, state:"HARVESTING"}
            }
        },
        findNearestEnergySource: (creep) => {
            creep.memory.status = {op: 0, state:"FINDING_NEAREST_SOURCE"}
        },
        findNearestEnergyDrop: (creep) => {
            creep.memory.status = {op: 1, state:"FINDING_NEAREST_ENERGY_DROP"}
        },
        keepTransferingToEnergyDrop: (creep) => {
            let nearestEnergyDrop = Harvester.isNearEnergyDrop(creep);
            if(nearestEnergyDrop.structure.structureType == STRUCTURE_SPAWN){
                let transfer = creep.transfer(nearestEnergyDrop.structure, RESOURCE_ENERGY);
                if(transfer != OK){
                    creep.say("❌ 💱");
                    console.log("Unable To Transfer Energy To Spawn: "+transfer+"\n Calculating New Route...");
                    Harvester.setNextTask.findNearestEnergyDrop(creep);
                }
                else{
                    creep.say("💱");
                    creep.memory.status = {op: 2, state:"TRANSFERING_ENERGY_TO_DROP"}
                }
            }
            else if(nearestEnergyDrop.structure.structureType == STRUCTURE_CONTROLLER){
                let upgrade = creep.upgradeController(nearestEnergyDrop.structure);
                if(upgrade != OK){
                    creep.say("❌ 💱");
                    console.log("Unable To Transfer Energy To Controller: "+upgrade+"\n Calculating New Route...");
                    Harvester.setNextTask.findNearestEnergyDrop(creep);
                }
                else{
                    creep.say("💱");
                    creep.memory.status = {op: 2, state:"TRANSFERING_ENERGY_TO_DROP"}
                }
            }
            else{
                console.log("Unknown Structure Type")
                Harvester.setNextTask.findNearestEnergyDrop(creep);
            }
        }
    },
    update: () => {
        Harvester.init();
        let harvesters = _.filter(Game.creeps, function(creep){
            return creep.memory.role == 0;
        });
        for(let i in harvesters){
            let harvester_creep = harvesters[i];
            if(harvester_creep){
                let harvester_creep_status = harvester_creep.memory.status;
                if(harvester_creep_status.state == "FINDING_NEAREST_SOURCE" || harvester_creep_status.state == "FIND_NEAREST_SOURCE"){
                    if(Harvester.isNearEnergySource(harvester_creep)){
                        Harvester.setNextTask.keepHarvesting(harvester_creep);
                    }
                    else{
                        //creep is not near energy source, move
                        harvester_creep.moveTo(harvester_creep.pos.findClosestByPath(FIND_SOURCES), {visualizePathStyle: {
                            fill: 'transparent',
                            stroke: '#41CBCB',
                            lineStyle: 'dashed',
                            strokeWidth: .1,
                            opacity: .4
                        }});
                    }
                }
                else if(harvester_creep_status.state == "HARVESTING"){
                    if(harvester_creep.carry.energy >= harvester_creep.carryCapacity){
                        //return resources to spawn or controller
                        Harvester.setNextTask.findNearestEnergyDrop(harvester_creep);
                    }
                    else{
                        Harvester.setNextTask.keepHarvesting(harvester_creep);
                    }
                }
                else if(harvester_creep_status.state == "FINDING_NEAREST_ENERGY_DROP" && harvester_creep.carry.energy > 0){
                    let nearestEnergyDrop = Harvester.isNearEnergyDrop(harvester_creep);
                    if(nearestEnergyDrop.isNear){
                        Harvester.setNextTask.keepTransferingToEnergyDrop(harvester_creep);
                    }
                    else{
                        //creep is not near energy drop, move
                        harvester_creep.moveTo(harvester_creep.pos.findClosestByPath([nearestEnergyDrop.structure]), {visualizePathStyle: {
                            fill: 'transparent',
                            stroke: '#FFCD42',
                            lineStyle: 'dashed',
                            strokeWidth: .1,
                            opacity: .4
                        }});
                    }
                }
                else if(harvester_creep_status.state == "TRANSFERING_ENERGY_TO_DROP"){
                    if(harvester_creep.carry.energy == 0){
                        Harvester.setNextTask.findNearestEnergySource(harvester_creep);
                    }
                    else{
                        Harvester.setNextTask.keepTransferingToEnergyDrop(harvester_creep);
                    }
                }
                else{
                    console.log("Unknown Creep State Or Doesn't Satisfy Conditions For State: "+harvester_creep_status.state)
                    Harvester.setNextTask.findNearestEnergySource(harvester_creep)
                }
            }
        }
    }
}

module.exports = Harvester;