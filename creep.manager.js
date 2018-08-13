/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

var CreepManager = {
    CreepsInRole: function(role_id, cb){
        let Creeps = _.filter(Game.creeps, function(creep){
            return creep.memory.role == role_id;
        });
        if(Creeps.length >= 0){
            cb(undefined, Creeps.length, Creeps)
        }
        else{
            cb("NO_CREEPS_FOUND")
        }
    },
    SpawnNewCreep: function(spawn, role_id, cb){
        if(Game.spawns[spawn].spawning == null){
            let creepBody = []
            let creepName = "CREEP_"
            let state = "FINDING_NEAREST_SOURCE"
            if(role_id == 0){
                creepBody = [WORK, WORK, CARRY, CARRY, CARRY, MOVE]; //400
                creepName += "HARVESTER_"
            }
            else if(role_id == 1){
                creepBody = [WORK, WORK, CARRY, MOVE]; //300
                creepName += "BUILDER_"
                state = "FINDING_NEAREST_ENERGY"
            }
            else if(role_id == 2){
                creepBody = [WORK, WORK, CARRY, MOVE]; //300
                creepName += "JANITOR_"
                state = "FINDING_NEAREST_STRUCTURE"
            }
            creepName += new Date().getTime();
            let spawning = Game.spawns[spawn].spawnCreep(creepBody, creepName, {memory:{role: role_id, status: {op: 0, state: state} }})
            if(spawning == OK){
                cb(undefined)
            }
            else if(spawning == ERR_BUSY){
                cb("ERR_BUSY")
            }
            else if(spawning == ERR_NOT_ENOUGH_ENERGY){
                cb("ERR_NOT_ENOUGH_ENERGY")
            }
            else{
                cb(spawning)
            }
        }
        else{
            cb(ERR_BUSY)
        }
    },
    EnsureCreepsForRole: function(role_id, max_number_of_creeps){
        this.CreepsInRole(role_id, (err, totalCreeps, Creeps) => {
            if(err){
                console.log(err)
            }
            if(totalCreeps < max_number_of_creeps){
                CreepManager.SpawnNewCreep("Spawn1", role_id, function(err){
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log("Succesfully Spawned New Creep");
                    }
                })
            }
        });
    }
}

module.exports = CreepManager;