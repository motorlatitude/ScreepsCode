/// <reference path="./Screeps-Typescript-Declarations/dist/screeps.d.ts"/>
var ConsoleCommands = require('console.commands');
var CreepManager = require('creep.manager');
var Harvesters = require('role.harvester');

module.exports.loop = () => {

    //HARVESTERS
    CreepManager.EnsureCreepsForRole(0, 5);
    Harvesters.update();

    //BUILDERS
    CreepManager.EnsureCreepsForRole(1, 2);


}