
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


const ProductList = {
    name:       'ProductList',
    template:   '#productList',

    data() {
        return {
            // profducts: this.$store.state.products,
            limit: 10,
            products: this.$store.state.products
        }
    },

    computed: {
        products: function() {
            return this.$store.state.products;
        }

    },

    mounted: function() {
        this.$store.dispatch('products');
        this.products = this.$store.state.products;
        console.log(this.products);
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
    name:       'ProductDetails',
    template:   '#productDetails',

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
            component: ProductList,
        },
        {
            name: 'catalog',
            path: '/catalog/:page',
            component: ProductList,
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
    name:   'root',
    router,
    store,

    created: function() {
        this.$store.commit('getProducts');
    },

    methods: {

    },


    components: {
        ProductList
    }
});


Vue.config.devtools = true
