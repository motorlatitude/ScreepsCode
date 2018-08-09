/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('console.commands');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    harvesterStates: () => {
        for(let name in Game.creeps){
            let creep = Game.creeps[name]
            if(!creep.memory.status){
                creep.memory.status = {
                    op: 0,
                    state: "FIND_NEAREST_SOURCE"
                }
            }
            console.log(creep.name, creep.memory.status.op, creep.memory.status.state)
        }
    }
};