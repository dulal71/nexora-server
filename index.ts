import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

const uri = process.env.MONGO_URI as string;
const dbName = process.env.DB_NAME as string;
const client = new MongoClient(uri);
let db: Db;
let products: Collection;

async function connectDB(): Promise<void> {
  try {
    await client.connect();
    db = client.db(dbName);
    products= db.collection('products')
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

//get product by id 
app.get('/api/product/:id',async (req: Request, res: Response)=>{
  try{
    const productId =req.params.id as string
    const query = {
      _id:new ObjectId(productId)
    }
    const result = await products.findOne(query)
     res.status(201).send(result);
  }catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
})

// Add New Product
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const product = req.body;
    const newProduct={
      ...product,
       createdAt: new Date()
    }
    
    const result = await products.insertOne(newProduct);
    res.status(201).send(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
});

// Get Product
app.get('/api/products', async (req: Request, res: Response) => {
  try {

    const cursor = products
      .find({})
      .sort({ createdAt: -1 });

    const result = await cursor.toArray();

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });

  }
});

// Delete Product 

app.delete('/api/product/:id',async(req:Request,res:Response)=>{
  try{
    const productId = req.params.id as string ;
    console.log('productId',productId);
    const query = {
      _id: new ObjectId(productId)
    }
const result = await products.deleteOne(query)
 res.status(200).json({
      success: true,
      data: result,
    });

  }catch(error){
     res.status(500).json({
      success: false,
      message: "Failed to delete products",
    });
  }
})

// Edit Product
app.patch('/api/product/:id',async(req:Request,res:Response)=>{
  try{
    const productId = req.params.id as string ;
    const data = req.body 
    console.log(data);
    const updateData = {
      $set:data
    }
    const query = {
      _id: new ObjectId(productId)
    }
const result = await products.updateOne(query,updateData)
 res.status(200).json({
      success: true,
      data: result,
    });

  }catch(error){
     res.status(500).json({
      success: false,
      message: "Failed to delete products",
    });
  }
})





app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});