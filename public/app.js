
const api = new axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 1000
});


const store = new Vuex.Store({
    state: {
        products: []
    },
    mutations: {
        getProducts(state, page) {
            page = page || 1;

            api.get(`/products/?_page=${page}`)
                .then((res) => {
                    this.products = res.data;
                    console.log(this.products);
                });
        }
    }
})


const TempComponent = {
    template: '<div>TEMP COMPONENT</div>'
};


const ProductsList = {
    template: '#productList',

    data: {
        // profducts: this.$store.state.products,
        products: [],
        limit: 10,
    },

    created: function() {
        this.products = this.$store.state.products;
    },

    beforeRouteUpdate: function(to, ref, next) {
        if (to.path === ref.path) { next(); }
    },

    computed: {
    },

    methods: {
    }
};


const ProductDetails = {
    template: '#productDetails',

    data: {
        product: null
    },

    created: function() {
        this.getProducts(this.$route.params.id);
    },

    beforeRouteUpdate: function(to, ref, next) {
        if (to.path === ref.path) {
            next();
        }

        this.getProducts(page, next);
    },

    methods: {
        getProducts: function(page, cb) {
            api.get(`/products/${page}`)
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
    mode: 'history',
    routes: [
        {
            name: 'home',
            path: '/',
            component: ProductsList,
        },
        {
            name: 'catalog',
            path: '/catalog/:page',
            component: ProductsList,
        },
        {
            name: 'product',
            path: '/catalog/products/:id',
            component: ProductDetails,
            props: true,
        },
        {
            name: 'about',
            path: '/about',
            component: TempComponent
        },
        {
            name: 'contact',
            path: '/contact',
            component: TempComponent
        },
    ]
});


const app = new Vue({
    el:     '#app',
    router: router,
    store:  store,

    created: function() {
        this.$store.commit('getProducts');
    },

    methods: {

    },

    components: {
        ProductsList
    }
});
