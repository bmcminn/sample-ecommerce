console.log('asfjdkslfjdsl');


const api = new axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 1000
});


const ProductsList = {
    template: '#productsList'
};

const ProductDetails = {
    template: '#productDetails',
    data: {
        product: null
    },
    created: function() {
        this.getProduct(this.$route.params.id);
    },
    beforeRouteUpdate: function(to, ref, next) {
        if (to.path === ref.path) {
            next();
        }

        this.getProduct(to.params.id, next);
    },
    methods: {
        getProduct: function(id, cb) {
            api.get(`/products/${id}`)
                .then((res) => {
                    this.product = res.data;

                    if (cb) {
                        cb();
                    }
                });
        }
    }
};


const router = new VueRouter({
    routes: [
        {
            name: 'products',
            path: '/products',
            component: ProductsList
        },
        {
            name: 'productDetails',
            path: '/products/:id',
            component: ProductDetails,
            props: true,
        },
    ]
});


const app = new Vue({
    el:     '#app',
    router: router,
    data: {
        products: [],
        limit: 10,
        product: null,
    },

    created: function() {
        this.getProducts();
    },

    methods: {
        getProducts: function(page) {
            api.get(`/products?_page=${page}&_limit=${this.limit}`)
                .then((res) => {
                    this.products = res.data;
                });
        }
    }
});

