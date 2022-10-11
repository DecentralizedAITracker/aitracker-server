import {IexecSDK} from './iexec_sdk/IexecSDK'
import {Utils} from './Utils'
const extract = require('extract-zip')

class IexecCrud {

    iexecSDK : IexecSDK
    isReady : boolean
    constructor(privateKey){
        this.isReady = false
        this.iexecSDK = new IexecSDK()
        this.init(privateKey)
        
    }

     init  = async (privateKey) => {
        await this.iexecSDK.init(privateKey)
        await this.iexecSDK.initStorage()
        this.isReady = true
    }

    async buyComputation(oracle_address,file_url){
        let dealid = await this.iexecSDK.buyComputation(oracle_address,file_url,(x)=>{})
        let taskId = await this.iexecSDK.showDeal(dealid)
    
        let task = false
        while(!task){
            let task_status = await this.iexecSDK.showTask(taskId)
            await Utils.delay(3000)
            if(task_status){
                if(task_status["statusName"] === "COMPLETED"){
                task = true
                } 
            }
        }

        return { taskId : taskId}
    }

    async downloadResult(taskId,dest,destExtract){
        //let taskId = await this.iexecSDK.showDeal(dealId)
        let {filepath , foldername, filename} = await this.iexecSDK.dowloadResults(taskId,dest)
        //console.log('filepath: ' + filepath)
        await extract(filepath, { dir: destExtract+foldername+"/" })
        //console.log("foldername: " + foldername)
        return { foldername : foldername, filename : filename}
    }


}

export {IexecCrud}