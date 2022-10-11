import { IExec, utils } from "iexec";
import * as fs from'fs'
var https = require('https');
class IexecSDK {
    iexec;
    constructor() {

    }

    async init(privateKey) {
        
            const ethProvider = utils.getSignerFromPrivateKey(
                'https://bellecour.iex.ec', // blockchain node URL
                privateKey,
            );
            const iexec = new IExec({
                ethProvider,
            });
            this.iexec = iexec
          
    }


    async getUserAccount() {
        const userAddress = await this.iexec.wallet.getAddress();
        const [wallet, account] = await Promise.all([
            this.iexec.wallet.checkBalances(userAddress),
            this.iexec.account.checkBalance(userAddress)
        ]);
        let native = utils.formatEth(wallet.wei).substring(0, 6)
        let nrlc = utils.formatRLC(wallet.nRLC)
        let walletStake = account.stake
        return { userAddress : userAddress, native: native, nrlc: nrlc, walletStake: walletStake }
    };

    async checkStorage() {
        try {

            const isStorageInitialized = await this.iexec.storage.checkStorageTokenExists(
                await this.iexec.wallet.getAddress()
            );

            if (isStorageInitialized) { return true };
            if (!isStorageInitialized) { return false };
        } catch (error) {
            console.log(error)
        }
    };

    async initStorage() {
        try {

            const storageToken = await this.iexec.storage.defaultStorageLogin();
            await this.iexec.storage.pushStorageToken(storageToken, {
                forceUpdate: true
            });
        } catch (error) {
            console.log("initStorage", error)
        }
    };

    async showApp(appAddress) {
        try {


            const res = await this.iexec.app.showApp(appAddress);
            return res
        } catch (error) {
            console.log("showApp", error)
        }
    };

    async showWorkerpoolOrderbook(workerpoolAddress) {
        try {

            const workerpoolOrders = await this.iexec.orderbook.fetchWorkerpoolOrderbook({ workerpool: workerpoolAddress });

            if (workerpoolOrders.orders[0] !== undefined) {
                return workerpoolOrders.orders[0]
            } else {
                console.log("showWorkerpoolOrderbook", "no workerpool orderbook orders")
            }

        } catch (error) {
            console.log("showWorkerpoolOrderbook", error)
        }
    };

    async showOrderbook(appAddress) {
        try {

            const appOrders = await this.iexec.orderbook.fetchAppOrderbook(appAddress);

            if (appOrders.orders[0] !== undefined) {
                return appOrders.orders[0]
            } else {
                console.log("showOrderbook", "no apporderbook orders")
            }
        } catch (error) {
            console.log("showOrderbook", error)
        }
    };

    async buyComputation(appAddress, file_url, onComputationProgress) {
        try {
            let category = 0
            let params = {
                iexec_result_storage_provider: "ipfs",
                iexec_result_storage_proxy: "https://v7.result.bellecour.iex.ec",
                iexec_input_files: file_url,
              };
            const appOrders = await this.iexec.orderbook.fetchAppOrderbook(appAddress);
            const appOrder = appOrders.orders[0]
            if (!appOrder) throw Error(`no apporder found for app ${appAddress}`);
            const workerpoolOrders = await this.iexec.orderbook.fetchWorkerpoolOrderbook(
                { category },
            );
            const workerpoolOrder = workerpoolOrders.orders[0];
            console.log("workerpoolOrder", workerpoolOrder)
            if (!workerpoolOrder)
                throw Error(`no workerpoolorder found for category ${category}`);

            const userAddress = await this.iexec.wallet.getAddress();

            const requestOrderToSign = await this.iexec.order.createRequestorder({
                app: appAddress,
                appmaxprice: appOrder.order.appprice,
                workerpoolmaxprice: workerpoolOrder.order.workerpoolprice,
                requester: userAddress,
                //workerpool: workerpoolOrder.order.workerpool,
                volume: 1,
                params : params,
                category,
            });
            onComputationProgress(1)
            const requestOrder = await this.iexec.order.signRequestorder(requestOrderToSign);
            //console.log("requestOrder",requestOrder)
            const res = await this.iexec.order.matchOrders({
                apporder: appOrder.order,
                requestorder: requestOrder,
                workerpoolorder: workerpoolOrder.order,
            });
            onComputationProgress(2)
            console.log("res_dealid", res.dealid)
            return res.dealid
        } catch (error) {
            console.log("buyComputation", error)
        }
    };

    async showDeal(dealid) {
        try {

            const deal = await this.iexec.deal.show(dealid);
            console.log("showDeal[''0'']", deal.tasks["0"])
            console.log("showDeal[0]", deal)
            return deal.tasks["0"]
        } catch (error) {
            //console.log("showDeal", error)
        } finally {
        }
    };

    async showTask(taskid) {
        try {

            const res = await this.iexec.task.show(taskid);
            return res

        } catch (error) {
            //console.log("showTask", error)
            return false
        } finally {
        }
    };

    async dowloadResults(taskid,dest) : Promise<{filepath : any, foldername : string, filename : string}>{
        try {


            let res = await this.iexec.task.fetchResults(taskid, {
                ipfsGatewayURL: "https://ipfs.iex.ec"
            });

            const blob = await res.json();
            const fileName = `${taskid}.zip`;
            
        } catch (error) {
            console.log("dowloadResults", error.message)
            let url_in_error  = error.message
            let part = url_in_error.split('https')[1]
            console.log(part)
            let part_2 = part.split(' reason')[0]
            let url = "https" + part_2
            console.log(url)
            let filename =  url.split('ipfs/')[1]
            console.log(filename)
            let foldername = filename.split('.zip')[0]

            
            let download = function(url, filepath) {
                return new Promise((resolve,reject) =>{
                    let file = fs.createWriteStream(filepath, {
                        mode : 0o777
                    });
                    https.get(url, function(response) {
                        response.pipe(file);
                        file.on('finish', function() {
                            file.close();
                            resolve(filepath)
                        });
                    });
                })
                
              }

              let cb = () => {}
              let filepath = await download(url,dest + filename + '.zip')
              console.log("download:" + filepath)
              return {filepath : filepath, foldername : foldername, filename : filename+".zip"}
        } finally {
        }

        return {filepath : 'error', foldername : 'error', filename : "error"}
    };

}

export { IexecSDK }