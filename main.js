/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>
var ConsoleCommands = require('console.commands');
var CreepManager = require('creep.manager');

module.exports.loop = () => {

    //HARVESTERS
    CreepManager.CreepsInRole(0, (err, totalCreeps, Creeps) => {
        if(err){
            console.log(err)
        }
        if(totalCreeps < 5){
            CreepManager.SpawnNewCreep("Spawn1",0, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Succesfully Spawned Harvester");
                }
            })
        }
    });
    //BUILDERS
    CreepManager.CreepsInRole(1, (err, totalCreeps, Creeps) => {
        if(err){
            console.log(err)
        }
        if(totalCreeps < 2){
            CreepManager.SpawnNewCreep("Spawn1",1, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Succesfully Spawned Builder");
                }
            })
        }
    });

    for(let name in Game.creeps){
        let creep = Game.creeps[name]
        if(creep.memory.role == 0){
            let nearestEnergySource = creep.pos.findClosestByPath(FIND_SOURCES)
            let nearestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS)
            if(!creep.memory.status){
                creep.memory.status = {
                    op: 0,
                    state: "FIND_NEAREST_SOURCE"
                }
            }
            if(creep.carry.energy == creep.carryCapacity || creep.memory.status.op == 2 || creep.memory.status.op == 3){
                if(nearestSpawn.energy == nearestSpawn.energyCapacity || creep.memory.status.op == 3){
                    //spawn is full
                    //let's put the energy into the controller
                    let nearestController = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTROLLER;
                    }})
                    if(nearestController){
                        let transferingToController = creep.upgradeController(nearestController)
                        if(transferingToController == 0){
                            creep.memory.status = {op: 3, state:"TRANSFERING_ENERGY_TO_CONTROLLER"}
                            if(creep.carry.energy == 0){
                                creep.memory.status = {op: 0, state:"FINDING_NEAREST_SOURCE"}
                            }
                        }
                        else if(transferingToController == ERR_NOT_IN_RANGE){
                            creep.memory.status = {op: 1, state:"FINDING_NEAREST_ENERGY_DROP"}
                            creep.moveTo(nearestController, {visualizePathStyle: {
                                fill: 'transparent',
                                stroke: "orange",
                                lineStyle: 'dashed',
                                strokeWidth: .1,
                                opacity: .4
                            }})
                        }
                        else if(transferingToController == ERR_NOT_ENOUGH_ENERGY){
                            //creep is empty
                            creep.memory.status = {op: 0, state:"FINDING_NEAREST_SOURCE"}
                        }
                        else if(transferingToController == ERR_BUSY){
                            //creep is busy
                            creep.memory.status = {op: 10, state:"BUSY"}
                        }
                        else{
                            console.log("Unknown Creep Transfer State: "+transferingToController)
                        }
                    }
                    else{
                        console.log("Can't find nearest controller")
                    }
                }
                else{
                    //creep is full
                    let transfering = creep.transfer(nearestSpawn, RESOURCE_ENERGY)
                    if(transfering == OK){
                        creep.memory.status = {op: 2, state:"TRANSFERING_ENERGY_TO_SPAWN"}
                        if(creep.carry.energy == 0){
                            creep.memory.status = {op: 0, state:"FINDING_NEAREST_SOURCE"}
                        }
                    }
                    else if(transfering == ERR_NOT_IN_RANGE){
                        creep.memory.status = {op: 1, state:"FINDING_NEAREST_ENERGY_DROP"}
                        creep.moveTo(nearestSpawn, {visualizePathStyle: {
                            fill: 'transparent',
                            stroke: "yellow",
                            lineStyle: 'solid',
                            strokeWidth: .1,
                            opacity: .6
                        }})
                    }
                    else if(transfering == ERR_BUSY){
                        //creep is busy
                        creep.memory.status = {op: 10, state:"BUSY"}
                    }
                    else if(transfering == ERR_NOT_ENOUGH_ENERGY){
                        //creep is empty
                        creep.memory.status = {op: 0, state:"FINDING_NEAREST_SOURCE"}
                    }
                    else{
                        console.log("Unknown Creep Transfer State: "+transfering)
                    }
                }
            }
            else{
                let harvesting = creep.harvest(nearestEnergySource)
                if(harvesting == 0){
                    creep.memory.status = {op: -1, state:"HARVESTING"}
                }
                else if(harvesting == ERR_NOT_IN_RANGE){
                    creep.memory.status = {op: 0, state:"FINDING_NEAREST_SOURCE"}
                    creep.moveTo(nearestEnergySource, {visualizePathStyle: {
                        fill: 'transparent',
                        stroke: 'grey',
                        lineStyle: 'dashed',
                        strokeWidth: .1,
                        opacity: .4
                    }})
                }
                else if(harvesting == ERR_INVALID_TARGET){
                    //creep can't find a free energy node
                    creep.memory.status = {op: 11, state:"WAITING"}
                    creep.say("⏰")
                }
                else if(harvesting == ERR_BUSY){
                    //creep is busy
                    creep.memory.status = {op: 10, state:"BUSY"}
                }
                else{
                    console.log("Unknown Creep Harvest State: "+harvesting)
                }
            }
        }
        else if(creep.memory.role == 1){
            //lower priority than spawning, make sure energy is available for this
            
        }
    }

}