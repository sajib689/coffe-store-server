const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
require('dotenv').config()
//middleware
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2m0rny5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyJWT = (req, res, next) => {
    
    const authorization = req.headers.authorization
    console.log(authorization)
    if(!authorization) {
    return res.status(401).send({error: true, message: 'Unauthorized access denied'})
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET,(error, decoded) =>{
      if(error) {
        return res.send({error: true, message: 'Unauthorized access denied'})
      }
      req.decoded = decoded
      next()
    })
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const coffeesCollection = client.db('coffeeDb').collection('coffees')
    const ordersCollection = client.db('coffeeDb').collection('orders')
    // send data to database api
    app.post('/coffees', async(req, res) => {
        const coffee = req.body
        const result = await coffeesCollection.insertOne(coffee)
        res.send(result)
    })
    //get data from database api
    app.get('/coffees', async(req, res) => {
        const result = await coffeesCollection.find().toArray()
        res.send(result)
    })
    // delete single data from database api

    app.delete('/coffees/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await coffeesCollection.deleteOne(query)
      res.send(result)
    })
    // call a single data for update request
    app.get('/coffees/:id', async (req, res) => {
      const id = req.params.id
      const query ={_id: new ObjectId(id)}
      const result = await coffeesCollection.findOne(query)
      res.send(result)
    })
    // update single data 
    app.put('/coffees/:id', async(req, res) => {
      const id = req.params.id
      const updateCoffee = req.body
      const query = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updatedCoffee = {
        $set: {
          coffeeName: updateCoffee.coffeeName,
          coffeeSupplier: updateCoffee.coffeeSupplier,
          coffeeCategory: updateCoffee.coffeeCategory,
          coffeeChef: updateCoffee.coffeeChef,
          coffeeTaste: updateCoffee.coffeeTaste,
          coffeeDetails: updateCoffee.coffeeDetails,
          coffeePhoto: updateCoffee.coffeePhoto
        }
      }
      const result = await coffeesCollection.updateOne(query, updatedCoffee,options)
      res.send(result)
    })
    // send orders
    app.post('/orders', async (req, res) => {
      const query = req.body
      const result = await ordersCollection.insertOne(query)
      res.send(result)
    })
    // get orders from the database
    app.get('/orders',verifyJWT, async (req, res) => {
      // console.log(req.headers.authorization)
      let query = {}
      if(req.query?.email){
        query={email: req.query.email} 
      }
      const result = await ordersCollection.find(query).toArray()
    res.send(result)
    })
    // delete orders from the database
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const orderDelete = await ordersCollection.deleteOne(query)
      res.send(orderDelete)
    })
    // post jwt
    app.post('/jwt', (req, res) => {
      const user = req.body
      console.log(user)
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: '1h'
      })
      res.send({token})
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Welcome the server!');
})

app.listen(port, () => {
    console.log(`response on port ${port}`)
})