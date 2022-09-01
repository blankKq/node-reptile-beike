let Region = require("./lib/region.js"); // 行政区域
let Metro = require("./lib/metro.js"); // 行政区域
 

const region = new Region()
let res = region.getAdministrativeDivision('https://www.ke.com/city/')

// const metro = new Metro()
// let res = metro.getMetroData('https://www.ke.com/city/')