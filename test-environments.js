"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gym_library_1 = require("gym-library");
console.log('Development environment:', gym_library_1.developmentEnvironment);
console.log('Production environment:', gym_library_1.productionEnvironment);
// Verificar que ambos tienen la estructura correcta
console.log('Development is production:', gym_library_1.developmentEnvironment.production);
console.log('Production is production:', gym_library_1.productionEnvironment.production);
console.log('Firebase config exists in dev:', !!gym_library_1.developmentEnvironment.firebase);
console.log('Firebase config exists in prod:', !!gym_library_1.productionEnvironment.firebase);
