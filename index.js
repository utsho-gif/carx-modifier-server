const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const res = require('express/lib/response');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/', (req,res) => {
    res.send('Gotcha');
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.unoqt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');
        const orderCollection = client.db('geniusCar').collection('order');

        //jwr verifier
        function verifyJWT(req, res, next){
            const authHeader = req.headers.authorization;
            if(!authHeader){
                return res.status(401).send({message: 'unothorized access'})
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if(err){
                    return res.status(403).send({message: 'Forbidden access'})
                }
                console.log('decoded', decoded);
                req.decoded = decoded;
                next();
            })
            
        }

        //auth
        app.post('/login', async(req,res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d',      //payload information
            });
            res.send({accessToken});

        })


        //send to client
        app.get('/services',async (req,res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        } )
        //find specific one
        app.get('/service/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })
        //get data from client
        app.post('/service', async(req,res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })
        //delete a data 
        app.delete('/service/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })

        //store order from client
        app.post('/order', async(req,res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder);
            res.send(result);
        })
        
        //get orders
        app.get('/order', verifyJWT, async(req,res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if(email === decodedEmail){
                const query = {email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else{
                res.status(403).send({message: 'Forbidden Access'});
            }
            
        })

    }
    finally{

    }

}

run().catch(console.dir);


app.listen(port,() => {
    console.log('Listening CURD', port);
})