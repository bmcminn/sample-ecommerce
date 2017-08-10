const path      = require('path');
const fs        = require('fs');
const chalk     = require('chalk');
const _         = require('lodash');

const db        = require(__dirname + '/../app/db.js');

const radix     = 10;


// CAPTURE ROUTES LIST FOR PROCESSING
db.products.find({}, (err, data) => {

    let products = data;

    _.each(products, (product, index) => {

        // compile list of brands
        if (product.brand) {

            let brand = {
                route:  `/${slugify(product.brand)}`
            ,   name:   product.brand
            };

            db.brands.insert(brand);
        }

    });


});






function slugify(str) {
    return str
        .toLowerCase()
        .replace(/\.([\w\s])|['"]/g, '$1')
        .replace(/[_\W]+/g, '-')
        .replace(/^-|-$/g, '')
        ;
}
