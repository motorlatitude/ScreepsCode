/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

var _ = require('lodash');

let Tower = {
    init: () => {

    },
    findClosestStructure: (tower) => {
        let hit_structures = tower.room.find(FIND_STRUCTURES, {filter: (o) => {
            return o.structureType == STRUCTURE_RAMPART || o.structureType == STRUCTURE_ROAD
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
    update: () => {
        let towers = _.filter(Game.structures, (o) => {
            return o.structureType == STRUCTURE_TOWER;
        });
        for(let t in towers){
            let tower = towers[t];
            if(tower.energy > 300){
                let repairing = tower.repair(Tower.findClosestStructure(tower))
                if(repairing != OK){
                    console.log("Tower Could Not Repair: "+repairing)
                }
            }
        }
    }
}

module.exports = Tower