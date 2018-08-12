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
                console.log(energy_source.id);
                console.log("Adding To Memory");
                let found = Game.spawns["Spawn1"].room.lookAtArea(energy_source.pos.y - 1, energy_source.pos.x - 1, energy_source.pos.y + 1, energy_source.pos.x + 1, true);
                let max_number_of_harvesters = 9;
                for(let f in found){
                    let type = found[f].terrain
                    console.log(type);
                    if(type == "wall"){
                        max_number_of_harvesters -= 1;
                    }
                }
                Memory.sourceQueue[energy_source.id] = {queued_creeps: [], max: max_number_of_harvesters, id: energy_source.id};
            }
            else{
                if(Memory.sourceQueue[energy_source.id].queued_creeps){
                    Game.spawns["Spawn1"].room.visual.text(Memory.sourceQueue[energy_source.id].queued_creeps.length, Game.getObjectById(energy_source.id).pos.x + 0.3, Game.getObjectById(energy_source.id).pos.y+0.2, {font: "0.4 arial", backgroundColor: "#DE5549",backgroundPadding: 0.1})
                }
            }
        }
    },
    findSourceIdForCreep: (harvester_creep) => {
        let sourceId = _.findKey(Memory.sourceQueue, (o) => {
            if(o.queued_creeps){
                return o.queued_creeps.indexOf(harvester_creep.id) !== -1
            }
            else{
                return false;
            }
        });
        console.log("sourceId: "+sourceId);
        return sourceId;
    },
    isNearEnergySource: (harvester_creep) => {
        if(harvester_creep != null){
            let source_id = Harvester.findSourceIdForCreep(harvester_creep);
            if(source_id){
                let queuedSource = Game.getObjectById(source_id)
                if(queuedSource){
                    return harvester_creep.pos.inRangeTo(queuedSource.pos,1);
                }
                console.log("Couldn't find source by id");
                return false
            }
            else{
                let highest_priority = 0
                let source = undefined
                for(let id in Memory.sourceQueue){
                    let source_queue = Memory.sourceQueue[id]
                    if(source_queue.queued_creeps){
                        let calculated_priority = Math.exp((source_queue.max/(source_queue.queued_creeps.length + 1)));
                        console.log(calculated_priority);
                        if(highest_priority == 0){
                            highest_priority = calculated_priority
                            source = source_queue
                        }
                        if(highest_priority < calculated_priority){
                            highest_priority = calculated_priority
                            source = source_queue
                        }
                            
                    }
                }
                if(source){
                    if(!Memory.sourceQueue[source.id].queued_creeps){
                        Memory.sourceQueue[source.id].queued_creeps = [];
                    }
                    Memory.sourceQueue[source.id].queued_creeps.push(harvester_creep.id)
                }
                return false;
            }
        }
        return false;
        
    },
    isNearEnergyDrop: (creep) => {
        let nearestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS)
        let nearestController = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (structure) => {
            return structure.structureType == STRUCTURE_CONTROLLER;
        }})
        if(nearestSpawn){
            //check if nearest spawn is full of energy and prioritise controller should it be below 25% upgraded or there are less than 2000 game ticks until it gets downgraded;
            if(nearestSpawn.energy >= nearestSpawn.energyCapacity || (nearestController.progress/nearestController.progressTotal) < 0.25 || nearestController.ticksToDowngrade < 2000){
                return {isNear: creep.pos.inRangeTo(nearestController.pos,3), structure: nearestController};
            }
            else{
                return {isNear: creep.pos.inRangeTo(nearestSpawn.pos, 1), structure: nearestSpawn};
            }
        }
        else{
            let nearestController = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTROLLER;
            }})
            return {isNear: creep.pos.inRangeTo(nearestController.pos,3), structure: nearestController};
        }
    },
    setNextTask: {
        keepHarvesting: (creep) => {
            let source_id = Harvester.findSourceIdForCreep(creep)
            if(source_id){
                let harvesting = creep.harvest(Game.getObjectById(source_id));
                if(harvesting != OK){
                    creep.say("❌ ⛏️");
                    console.log("Error Occurred Attempting To Mine Energy: "+harvesting)
                }
                else{
                    creep.say("⛏️");
                    creep.memory.status = {op: -1, state:"HARVESTING"}
                }
            }
            else{
                Harvester.setNextTask.findNearestEnergySource(creep);
            }
        },
        findNearestEnergySource: (creep) => {
            creep.memory.status = {op: 0, state:"FINDING_NEAREST_SOURCE"}
        },
        findNearestEnergyDrop: (creep) => {
            let source_id = Harvester.findSourceIdForCreep(creep);
            if(source_id){
                let qc = Memory.sourceQueue[source_id].queued_creeps
                qc = qc.splice(qc.indexOf(creep.id),1);
                Memory.sourceQueue[source_id].queued_creeps = qc;
                creep.memory.source_target = undefined;
            }
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
                if(harvester_creep_status.state == "FINDING_NEAREST_SOURCE"){
                    if(Harvester.isNearEnergySource(harvester_creep)){
                        Harvester.setNextTask.keepHarvesting(harvester_creep);
                    }
                    else{
                        //creep is not near energy source, move
                        harvester_creep.moveTo(Game.getObjectById(Harvester.findSourceIdForCreep(harvester_creep)), {visualizePathStyle: {
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