import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, Db, Collection, ObjectId, WithId, Document } from "mongodb";

dotenv.config();
declare global {
  namespace Express {
    interface Request {
      user?: WithId<Document>;
    }
  }
}

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

const uri = process.env.MONGO_URI as string;
const dbName = process.env.DB_NAME as string;
const client = new MongoClient(uri);
let db: Db;
let products: Collection;
let userSession:Collection;
let userCollection:Collection;

async function connectDB(): Promise<void> {
  try {
    await client.connect();
    db = client.db(dbName);
    products= db.collection('products')
    userSession=db.collection('session')
    userCollection=db.collection('user')
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}


// User Token Verify

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers?.authorization;
 
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = authHeader.split(" ")[1];
 
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const query ={token:token}
  const session = await userSession.findOne(query)
  if (!session) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const userId=session.userId;
  const userQuery={
    _id:userId
  }
  const user = await userCollection.findOne(userQuery)
  if(!user){
     return res.status(401).send({ message: 'unauthorized access' });
  }
  req.user=user
  next()
};

// verify-admin
const verifyAdmin=async(req:Request,res:Response,next:NextFunction)=>{
  if(req.user?.role !== 'admin'){
    return res.status(403).send({message:'forbidden access'})
  }
next()
}


// verify-user
const verifyUser=async(req:Request,res:Response,next:NextFunction)=>{
  if(req.user?.role !== 'user'){
    return res.status(403).send({message:'forbidden access'})
  }
next()
}
// Get Product
app.get('/api/products' ,async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string
    const sort = req.query.sort as string 
   const category = req.query.category as string
   
    let query:any = {}
    let sortOption: Record<string, 1 | -1> = {
  createdAt: -1
};
   
    if(search){
      query.name ={
         $regex: search,
        $options: "i"
      }
    }
     if(sort === 'price-low'){
      sortOption={price : 1}
    }
    if(sort === 'price-high'){
      sortOption={price : -1}
    }
    
if (sort === "newest") {
  sortOption = { createdAt: -1 };
}
if (sort === "popular") {
  sortOption = { createdAt: -1 };
}

if(category){
  query.category={
         $regex:category,
        $options: "i"
      }
}
    const page = Number(req.query.page)  || 1
    const perPage = 12;
    const skip = (page-1)*perPage
    const totalProduct=await products.countDocuments()
    const cursor = products.find(query).sort(sortOption).skip(skip).limit(perPage)
    
    const result = await cursor.toArray();

    res.status(200).json({
      success: true,
      data: result,
      total:totalProduct
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });

  }
});
//Get product By Id 
app.get('/api/product/:id',verifyToken, async (req: Request, res: Response)=>{
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

// Add My Product
 app.get('/api/my-orders', verifyToken, verifyUser, async (req:Request, res:Response) => {  })

 // Add New Product
app.post('/api/products',verifyToken,verifyAdmin, async (req: Request, res: Response) => {
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



// Delete Product 

app.delete('/api/product/:id',verifyToken,verifyAdmin,async(req:Request,res:Response)=>{
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
app.patch('/api/product/:id',verifyToken,verifyAdmin,async(req:Request,res:Response)=>{
  try{
    const productId = req.params.id as string ;
    const data = req.body 
    console.log(data,'data');
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