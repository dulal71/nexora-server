"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const client = new mongodb_1.MongoClient(uri);
let db;
let products;
async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        products = db.collection('products');
        console.log("MongoDB Atlas connected successfully");
    }
    catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}
//Get product By Id 
app.get('/api/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const query = {
            _id: new mongodb_1.ObjectId(productId)
        };
        const result = await products.findOne(query);
        res.status(201).send(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create product',
        });
    }
});
// Add New Product
app.post('/api/products', async (req, res) => {
    try {
        const product = req.body;
        const newProduct = {
            ...product,
            createdAt: new Date()
        };
        const result = await products.insertOne(newProduct);
        res.status(201).send(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create product',
        });
    }
});
// Get Product
app.get('/api/products', async (req, res) => {
    try {
        const search = req.query.search;
        const sort = req.query.sort;
        const category = req.query.category;
        let query = {};
        let sortOption = {
            createdAt: -1
        };
        if (search) {
            query.name = {
                $regex: search,
                $options: "i"
            };
        }
        if (sort === 'price-low') {
            sortOption = { price: 1 };
        }
        if (sort === 'price-high') {
            sortOption = { price: -1 };
        }
        if (sort === "newest") {
            sortOption = { createdAt: -1 };
        }
        if (sort === "popular") {
            sortOption = { createdAt: -1 };
        }
        if (category) {
            query.category = {
                $regex: category,
                $options: "i"
            };
        }
        const page = Number(req.query.page) || 1;
        const perPage = 12;
        const skip = (page - 1) * perPage;
        const totalProduct = await products.countDocuments();
        const cursor = products.find(query).sort(sortOption).skip(skip).limit(perPage);
        const result = await cursor.toArray();
        res.status(200).json({
            success: true,
            data: result,
            total: totalProduct
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
});
// Delete Product 
app.delete('/api/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log('productId', productId);
        const query = {
            _id: new mongodb_1.ObjectId(productId)
        };
        const result = await products.deleteOne(query);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete products",
        });
    }
});
// Edit Product
app.patch('/api/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const data = req.body;
        console.log(data, 'data');
        console.log(data);
        const updateData = {
            $set: data
        };
        const query = {
            _id: new mongodb_1.ObjectId(productId)
        };
        const result = await products.updateOne(query, updateData);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete products",
        });
    }
});
app.get("/", (req, res) => {
    res.send("Hello World!");
});
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});
