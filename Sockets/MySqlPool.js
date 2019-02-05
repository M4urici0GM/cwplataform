var mysql = require('mysql');
var db;
module.exports = {
    init: (conf) => {
        if (!db) { //checks if db's already initialized, if not, create a new pool.
            db = mysql.createPool(conf);
        }
    },
    get: () => {
        if (!db) //throws an error if connections isn't created yet.
            throw new Error('Connection not made yet, please call init() prior to get()');
        return db;
    }
}