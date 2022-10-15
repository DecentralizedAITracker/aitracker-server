var cron = require('node-cron');
require('dotenv').config();
import {IexecCrud} from './src/IexecCrud'
import { PrismaClient } from '@prisma/client'
import { promises as fsAsync } from "fs"
const { ethers } = require("ethers");

const AITrackerBTCUSDT = require("./AITrackerBTCUSDT.json");
const AITrackerXMRUSDT = require("./AITrackerXMRUSDT.json");
const AITrackerRLCUSDT = require("./AITrackerRLCUSDT.json");

const prisma = new PrismaClient()
let SERVER_ADDRESS = "https://predictme.io:3003/"
let PUBLIC = "public/"
let ABSULUTEPATH_PUBLIC = __dirname + "/public/"
const network = "goerli";
const findPredictionOlderThanMin = 65

class IexecServer{
    iexecCrud
    aitracker_btcusdt
    aitracker_xmrusdt
    aitracker_rlcusdt
    constructor(_privateKey){
        this.iexecCrud = new IexecCrud(_privateKey)
        const provider = new ethers.providers.InfuraProvider(network, process.env.INFURA_API_KEY);
        const wallet = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider);
        
        this.aitracker_btcusdt = new ethers.Contract(AITrackerBTCUSDT.address, AITrackerBTCUSDT.abi, wallet); 
        this.aitracker_xmrusdt = new ethers.Contract(AITrackerXMRUSDT.address, AITrackerXMRUSDT.abi, wallet);
        this.aitracker_rlcusdt = new ethers.Contract(AITrackerRLCUSDT.address, AITrackerRLCUSDT.abi, wallet);
    }

    onCron = async () => {
        let predictions = await this.findTask()
        for(let prediction of predictions){
            if(prediction.isScored){continue}
            console.log("predictions found")
            console.log(prediction)
            console.log("downloading result...")
            let appResult = await this.downloadResult(prediction.taskId,PUBLIC,ABSULUTEPATH_PUBLIC)
            console.log("downloaded app results")
            console.log("running oracle...")
            let taskId = await this.runOracle(prediction.oracle_address,appResult.result_url)
            console.log("oracle run finished")
            console.log("downloading oracle results...")
            let oracleResult = await this.downloadResult(taskId,PUBLIC,ABSULUTEPATH_PUBLIC)
            console.log("oracle results downloaded")
            console.log("getting the result...")
            let result = await this.getResult(oracleResult.foldername)
            console.log("result read")
            console.log("updating stats...")
            await this.updateStats(result,prediction.dapp_address)
            console.log("stats updated")
            console.log("updating prediction...")
            await this.updatePrediction(prediction.id,result)
            console.log("prediction updated")
            console.log("deleting files...")
            await this.deleteFiles(appResult.foldername,appResult.filename)
            await this.deleteFiles(oracleResult.foldername,oracleResult.filename)
            console.log("files delted")
            
            console.log("finished")
        }
    }

    findTask = async () => {
        let predictions = await prisma.prediction.findMany({
            where : {
                timestamp : {
                    lt : (Date.now() - ( findPredictionOlderThanMin*60*1000) )
                }
            }
        })
        console.log(predictions)
        return predictions
    }

    downloadResult = async (deailId,dest,destExtract) => {
        let { foldername , filename } = await this.iexecCrud.downloadResult(deailId,dest,destExtract)
        let result_url = SERVER_ADDRESS + foldername + "/result.json"
        //console.log("url: " + SERVER_ADDRESS + "public/" + foldername + "/result.json")
        return {foldername : foldername, filename : filename, result_url : result_url}
    }

    deleteFiles = async (foldername,filename) => {
        let dirFolder = "public/" + foldername
        let dirFile = "public/" + filename
        await fsAsync.rm(dirFolder, { recursive: true });
        await fsAsync.rm(dirFile);
    }

    runOracle = async (oracle_address,file_url) => {
        let {taskId} = await this.iexecCrud.buyComputation(oracle_address,file_url)
        return taskId
    }

    initStat = async (dapp_address) =>{
        await prisma.stats.create({
            data : {
                dapp_address : dapp_address,
                total_predictions : 0,
                correct_predictions : 0,
                incorrect_prediction : 0
            }
        })
    }

    getResult = async (foldername) => {
        let filepath = "public/" + foldername + "/result.json"
        let content = await fsAsync.readFile(filepath,"utf-8")
        let result = JSON.parse(content)["isCorrect"]
        return result
    }

    updateContract = async (isCorrect,dappAddress) => {
        if(dappAddress == "0xCD167e052bbCfeeD505D9a9d5cB54feCeE995b7D"){ //btc
            await this.aitracker_btcusdt.updateStats(isCorrect,dappAddress)
        } 

        if(dappAddress == "0x8c9f733bEB7F73843ad3dcE2A7EB66beDD4A3476"){ //xmr
            await this.aitracker_xmrusdt.updateStats(isCorrect,dappAddress)
        } 

        if(dappAddress == "0x8B25C7a2B49F436B555a9D217f1824e84A70Fd85"){ //rlc
            await this.aitracker_rlcusdt.updateStats(isCorrect,dappAddress)
        } 
    }

    updateStats = async (result,dapp_address) => {
        
        let stat = await prisma.stats.findFirst({
            where : {
                dapp_address : dapp_address
            }
        })
        if(!stat){
            await this.initStat(dapp_address)
        }

        stat = await prisma.stats.findFirst({
            where : {
                dapp_address : dapp_address
            }
        })

        if(stat){
            if(result){
                console.log("CORRECT")
                await this.updateContract(true,stat.dapp_address)
                await prisma.stats.update({
                    where : {id : stat.id},
                    data :{
                        total_predictions : stat.total_predictions+1,
                        correct_predictions : stat.correct_predictions+1
                    }
                })
            }else if(!result){
                console.log("INCORRECT")
                await this.updateContract(false,stat.dapp_address)
                await prisma.stats.update({
                    where : {id : stat.id},
                    data :{
                        total_predictions : stat.total_predictions+1,
                        incorrect_prediction : stat.incorrect_prediction+1
                    }
                })
            }
        }
       

    }

    updatePrediction = async (id,isCorrect) => {
       await prisma.prediction.update({
        where : {id : id},
        data : {
            isScored : true,
            isCorrect : isCorrect
        }
       })
    }

    
}

let iexecServer = new IexecServer(process.env.SIGNER_PRIVATE_KEY)
//iexecServer.downloadResult('0x0b9cdb228eaa8e657192d1003dac206ea43c63298749dae8393d910b8882e088','public/',__dirname +'/public/')
//iexecServer.findTask()


let main = async () =>{
 await iexecServer.onCron()
}

cron.schedule('*/45 * * * *', () => {
    main()
    console.log('running a task every 5 minutes');
  });
