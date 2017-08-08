const path      = require('path');
const Promise   = require('bluebird');
const fs        = require('fs');
const cheerio   = require('cheerio');
const db        = require(__dirname + '/../app/db.js');
const _         = require('lodash');
const Batch     = require('batch');
const batch     = new Batch;
const request   = require('request');

const radix     = 10;

batch.concurrency(4);


let routes = fs.readFileSync(__dirname + '/products.xml')
    .toString()
    .trim()
    .split('\n')
;


let chunks = _.chunk(routes, 10);


// chunks.foreach((chunk) => {
//     batch.push((done) => {

//     });
// });




_.each(chunks[0], (route) => {

    console.log(route);
    let opts = {
        url: route
    ,   timeout: 10*1000
    };

    request(opts, (err, res, body) => {

        let $ = cheerio.load(body);

        let product = {};

        product._route = route;

        // GET PRODUCT ATTRIBUTES
        $('#product-attribute-specs-table tr')
            .each((index, row) => {
                let $this = $(row);
                let label = $this.find('th').text().trim().toLowerCase();
                let value = $this.find('td').text().trim();

                product[label] = value;
            });


        // GET PRODUCT DESCRIPTION
        product.description = $('.des-conten').text().trim();


        // GET PRODUCT PRICE
        product.price = $('.price-box').text().trim()
            .match(/only:[\s$\d\.]+/gi)[0]
            .replace(/^[\s\S]+?\$/, '')
            ;

        product.price = parseFloat(product.price, radix);


        // NORMALIZE PRODUCT SKU/CODE
        product.sku = parseInt(product.sku, radix);


        // get PRODUCT STOCK AVAILABILITY
        let $stock = $('.availability');

        product.inStock     = $stock.hasClass('in-stock');
        product.inStoreOnly = $stock.hasClass('in-store-only');


        // GET PRODUCT BLURB
        product.blurb = $('#featureBlurbDiv').text().trim();


        // GET PRODUCT IMAGERY
        product.images = [];

        let $imagesContainer = $('#thumbnails');

        $imagesContainer.find('a.item').each((index, image) => {
            let $this = $(image);
            product.images.push($this.prop('href'));
        });

        product.video = $('#product_video_overlay > iframe').prop('src');


        // get PRODUCT ENDORSEMENTS
        product.endorsements = $('.endorsements').text().trim() || null;
        product['endorsements-source'] = $('.endorsements-source').text().trim() || null;


        // GET PRODUCT NAME
        !product.name
            ? product.name = $('h1').text().trim()
            : null
            ;

        console.log(JSON.stringify(product, null, 2));


    });
});


