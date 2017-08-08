const path      = require('path');
const DATA_DIR  = path.join(process.cwd(), 'data');


let dbDefaults = {
        timestampData: true
    ,   autoload: true
    };

const db = {};
const Datastore = require('nedb');


function registerCollection(name) {
    db[name] = new Datastore(Object.assign({}, {
            filename: path.join(DATA_DIR, `${name}.json`)
        }, dbDefaults)
    );
}


registerCollection('products');
registerCollection('reviews');
registerCollection('images');


module.exports = db;
