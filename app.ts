const express = require("express");
import { PrismaClient } from '@prisma/client'
const cors = require("cors");
let bodyParser = require('body-parser')
import { promises as fsAsync } from "fs"
import uniqid from 'uniqid';
const { ethers } = require("ethers");
require('dotenv').config();
const https = require('https')
const fs = require('fs')
const path = require('path')

const AITrackerBTCUSDT = require("./AITrackerBTCUSDT.json");
const AITrackerXMRUSDT = require("./AITrackerXMRUSDT.json");
const AITrackerRLCUSDT = require("./AITrackerRLCUSDT.json");

const port = 3003

const app = express();
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient()

const network = "goerli";
const provider = new ethers.providers.InfuraProvider(network, process.env.INFURA_API_KEY);
const wallet = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider);
const aitracker_btcusdt = new ethers.Contract(AITrackerBTCUSDT.address, AITrackerBTCUSDT.abi, wallet); 
const aitracker_xmrusdt = new ethers.Contract(AITrackerXMRUSDT.address, AITrackerXMRUSDT.abi, wallet);
const aitracker_rlcusdt = new ethers.Contract(AITrackerRLCUSDT.address, AITrackerRLCUSDT.abi, wallet);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.post('/publickey',async (req,res) =>{

  let publicKey = req.body["publicKey"]

  let filename = uniqid() + '.pem'
  let filepath = 'public/' + filename

  await fsAsync.writeFile(filepath,publicKey)

  await prisma.file.create({
    data : {
      filename : filename,
      timestamp: Date.now()
    }
  })

  let url_file = "https://predictme.io:3003/" + filename
  let response = {
    url_file : url_file
  }
  res.send(response)
})

app.post('/',  async (req, res) => {
  await prisma.prediction.create({
    data : {
      dapp_address : req.body["dappAddress"],
      oracle_address : req.body["oracleAddress"],
      taskId : req.body["taskId"],
      timestamp : req.body["timestamp"],
      isScored : false
    }
  })
  
  res.send("{ 'test' : 'test'}")
})

app.post('/stats', async (req,res) =>{
    let dapp_address = req.body["dappAddress"]
    let response = [404,404,404,404]
    if(dapp_address == "0xCD167e052bbCfeeD505D9a9d5cB54feCeE995b7D"){ //btc
      response = await aitracker_btcusdt.fetchStats()
  } 

  if(dapp_address == "0x8c9f733bEB7F73843ad3dcE2A7EB66beDD4A3476"){ //xmr
    response = await aitracker_xmrusdt.fetchStats()
  } 

  if(dapp_address == "0x8B25C7a2B49F436B555a9D217f1824e84A70Fd85"){ //rlc
    response = await aitracker_rlcusdt.fetchStats()
  } 
  let [res_dapp_address, res_total_runs, res_correct_prediction,res_incorrect_predictions] = response
    res.send({total_predictions : res_total_runs, correct_predictions : res_correct_prediction, incorrect_prediction : res_incorrect_predictions})
})



const sslServer = https.createServer({
  key : fs.readFileSync("/etc/letsencrypt/live/predictme.io/privkey.pem",'utf8'),
  cert : fs.readFileSync("/etc/letsencrypt/live/predictme.io/fullchain.pem",'utf8')
},app)

sslServer.listen(port,() => {
   console.log(`Example app listening on port ${port}`)
  })
//app.listen(port, () => {
//  console.log(`Example app listening on port ${port}`)
//})
