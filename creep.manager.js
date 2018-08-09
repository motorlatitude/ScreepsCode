module.exports = {
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
            if(role_id == 0){
                creepBody = [WORK, CARRY, MOVE, MOVE];
                creepName += "HARVESTER_"
            }
            else if(role_id == 1){
                creepBody = [WORK, WORK, CARRY, MOVE];
                creepName += "BUILDER_"
            }
            creepName += new Date().getTime();
            let spawning = Game.spawns[spawn].spawnCreep(creepBody, creepName, {memory:{role: role_id, status: {op: 0, state: "FINDING_NEAREST_SOURCE"} }})
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
    }
}