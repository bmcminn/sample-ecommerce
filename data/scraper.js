const path      = require('path');
const Promise   = require('bluebird');
const fs        = require('fs');
const cheerio   = require('cheerio');
const chalk     = require('chalk');
const db        = require(__dirname + '/../app/db.js');
const _         = require('lodash');
const Batch     = require('batch');
const batch     = new Batch;
const request   = require('request');
const toMD      = require('to-markdown');


const radix     = 10;
const IS_DEV    = false;

// PROCESS CONFIGS
batch.config = {
    delay:          2 // time in seconds
,   concurrency:    10 // number of requests to run concurrently
};


// CAPTURE ROUTES LIST FOR PROCESSING
let routes = fs.readFileSync(__dirname + '/products.xml')
    .toString()
    .trim()
    .split('\n')
;


// // DEBUGGING PROBLEM ROUTES
// routes = [
//     'https://www.harborfreight.com/160-psi-14-npt-dry-gauge-68249.html'
// ,   'https://www.harborfreight.com/160-psi-dry-gauge-68249.html'
// ];


// DEFINE CONCURRENCY OF PROCESS
batch.concurrency(batch.config.concurrency);


// INITIALIZE BATCH LIST
_.each(routes, (route, index) => {
    if (route.match(/^#/)) {
        console.log(chalk.magenta('skipping', route));
        return;
    }

    // new Promise((resolve, reject) => {
    //     db.products.find({ _route: route}, (err, docs) => {
    //         if (err) { reject(); }
    //         if (docs.count > 0) { reject(); }
    //         resolve();
    //     })
    // })
    //     .then(() => {
    //         batch.push((done) => {
    //             setTimeout(() => {
    //                 processRoute(route)
    //                     .then(() => {
    //                         done(null, route);
    //                     });
    //                 }, batch.config.delay * 1000);
    //         });
    //     });

    batch.push((done) => {
        setTimeout(() => {
            processRoute(route)
                .then(() => {
                    done(null, route);
                });
            }, batch.config.delay * 1000);
    });



});


batch.on('progress', (e) => {
    // console.log(e);

    msg = [
        `Progress: ${e.percent}%`
    ,   chalk.blue(e.index) + ' of ' + chalk.cyan(e.total)
    ,   chalk.green(e.pending, 'remaining')
    ,   chalk.yellow(e.value)
    ].join(' -- ');

    console.log(msg);

});


batch.on('end', (err, data) => {
    // console.log('batch data:', data);
});


batch.end((err, res) => {
    // TODO: add process metrics to output
    console.log(`Process complete!`);
});




function processRoute(route) {

    let opts = {
        url: route
    ,   timeout: 10*1000
    };

    return new Promise((resolve, reject) => {

        request(opts, (err, res, body) => {

            if (!res) {
                db.products.update({ _route: route }, { _route: route, reason: 'no response object' }, { upsert: true }, () => {
                    // console.log(`- Error: no response object`);
                });

                resolve();
                return;
            }

            if (res.statusCode === 404) {
                db.products.update({ _route: route }, { _route: route, reason: 404}, { upsert: true }, () => {
                    // console.log(`- Error: product page returned 404`);
                });

                resolve();
                return;
            }

            if (res.statusCode === 302) {
                db.products.update({ _route: route }, { _route: route, reason: 302}, { upsert: true }, () => {
                    // console.log(`- Error: product page returned 404`);
                });

                resolve();
                return;
            }

            // if (res.location !== route) {
            //     db.products.update({ _route: route }, { _route: route, reason: '302 to homepage'}, { upsert: true }, () => {
            //         // console.log(`- Error: product page returned 404`);
            //     });

            //     resolve();
            //     return;
            // }

            let $ = cheerio.load(body);

            let product = {};


            // get original product route
            product._route = route;


            // GET PRODUCT ATTRIBUTES
            product.attributes = [];

            $('#product-attribute-specs-table tr')
                .each((index, row) => {
                    let $this = $(row);

                    let label = $this.find('th').text().trim().toLowerCase();
                    let value = $this.find('td').text().trim();

                    switch(label) {
                        case 'name':
                        case 'sku':
                        case 'brand':
                            product[label] = value;
                            break;
                        default:
                            product.attributes.push({
                                label: label
                            ,   value: value
                            });
                            break;
                    }

                });


            // GET PRODUCT WARRANTY INFO
            product.warranty = [];

            $('#product-attribute-warranty-table tr')
                .each((index, row) => {
                    let $this = $(row);

                    let label = $this.find('th').text().trim();
                    let value = $this.find('td').text().trim();

                    product.warranty.push({
                        label: label
                    ,   value: value
                    });
                });


            // GET PRODUCT DESCRIPTION
            product.description = $('.des-conten').html();

            if (!product.description) {
                console.log(chalk.red('> Error:', route));

            } else {
                product.description = toMD(product.description).trim();

            }



            // GET PRODUCT PRICE
            product.price = $('.price-box').text()
            product.price = product.price.trim()
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

            product.video = $('#product_video_overlay > iframe').prop('src') || null;

            product.fanVideo = $('#product-fan-video > iframe').prop('src') || null;

            // get PRODUCT ENDORSEMENTS
            product.endorsements = $('.endorsements').text().trim() || null;
            product['endorsements-source'] = $('.endorsements-source').text().trim() || null;


            // GET PRODUCT NAME
            !product.name
                ? product.name = $('h1').text().trim()
                : null
                ;


            if (IS_DEV) {
                console.log(product._route);
                // console.log(JSON.stringify(product, null, 2));

            } else {
                db.products.update({ _route: product._route }, product, { upsert: true }, () => {
                    // console.log(`- Adding product ${product.sku} to catalog`);
                });
            }

            resolve();
        });

    });
}


