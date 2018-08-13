/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>
var ConsoleCommands = require('console.commands');
var CreepManager = require('creep.manager');
var EnergyManager = require('energy.manager');
var Harvesters = require('role.harvester');
var Upgraders = require('role.upgrader');
var Builders = require('role.builder');
var Janitors = require('role.janitor');
var Towers = require('role.tower');

module.exports.loop = () => {

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    EnergyManager.totalAvailableEnergy()

    //HARVESTERS
    CreepManager.EnsureCreepsForRole(0, 6);
    Harvesters.update();

    //BUILDERS
    CreepManager.EnsureCreepsForRole(1, 2);
    Builders.update();

    //JANITORS
    CreepManager.EnsureCreepsForRole(2, 4);
    Janitors.update();

    //UPGRADERS
    CreepManager.EnsureCreepsForRole(3, 1);
    Upgraders.update();

    //TOWER
    Towers.update();

}