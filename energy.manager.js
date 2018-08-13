/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>

let EnergyManager = {
    totalAvailableEnergy: () => {
        let totalAvailableEnergy = 0
        for(var name in Game.rooms) {
            totalAvailableEnergy += Game.rooms[name].energyAvailable
            console.log('Room "'+name+'" has '+Game.rooms[name].energyAvailable+' energy');
        }
        Memory.totalAvailableEnergy = totalAvailableEnergy;
        return totalAvailableEnergy;
    },
    energyStillFree: () => {
        return Memory.totalAvailableEnergy || 0
    },
    storeEnergy: (amount) => {

    },
    reserveEnergy: (amount) => {

    }
}

module.exports = EnergyManager