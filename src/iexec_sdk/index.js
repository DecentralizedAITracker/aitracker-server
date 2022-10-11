import {
    IExec,
    utils
} from "iexec";

const networkOutput = document.getElementById("network");
const addressOutput = document.getElementById("address");

const nativeWalletOutput = document.getElementById("native-wallet");
const accountOutput = document.getElementById("account");

const accountWithdrawError = document.getElementById("account-withdraw-error");
const storageInitButton = document.getElementById("storage-init-button");
const storageInitError = document.getElementById("storage-init-error");
const storageCheckOutput = document.getElementById("storage-check-output");
const storageCheckError = document.getElementById("storage-check-error");
const appsShowInput = document.getElementById("apps-address-input");
const appsShowButton = document.getElementById("apps-show-button");
const appsShowError = document.getElementById("apps-show-error");
const appsShowOutput = document.getElementById("apps-details-output");

const appOrderbookShowInput = document.getElementById("app-orderbook-address-input");
const appOrderbookShowButton = document.getElementById("app-orderbook-show-button");
const appOrderbookShowError = document.getElementById("app-orderbook-show-error");
const appOrderbookShowOutput = document.getElementById("app-orderbook-details-output");

const workerpoolOrderbookShowInput = document.getElementById("workerpool-address-input");
const workerpoolOrderbookShowButton = document.getElementById("workerpool-show-button");
const workerpoolOrderbookShowError = document.getElementById("workerpool-show-error");
const workerpoolOrderbookShowOutput = document.getElementById("workerpool-details-output");

const buyBuyButton = document.getElementById("buy-buy-button");
const buyBuyError = document.getElementById("buy-buy-error");
const buyBuyOutput = document.getElementById("buy-dealid-output");
const buyAppAddressInput = document.getElementById("buy-appaddress-input");
const buyCategoryInput = document.getElementById("buy-category-input");
const buyParamsInput = document.getElementById("buy-params-input");
const buyWorkerpoolInput = document.getElementById("workerpool-input");
const buyTrustInput = document.getElementById("buy-trust-input");
const resultsDealidInput = document.getElementById("results-dealid-input");
const resultsShowDealButton = document.getElementById(
    "results-showdeal-button"
);
const resultsShowDealError = document.getElementById("results-showdeal-error");
const resultsShowDealOutput = document.getElementById(
    "results-dealdetails-output"
);
const resultsTaskidInput = document.getElementById("results-taskid-input");
const resultsShowTaskButton = document.getElementById(
    "results-showtask-button"
);
const resultsShowTaskError = document.getElementById("results-showtask-error");
const resultsShowTaskOutput = document.getElementById(
    "results-taskdetails-output"
);
const resultsDownloadInput = document.getElementById("results-download-input");
const resultsDownloadButton = document.getElementById(
    "results-download-button"
);
const resultsDownloadError = document.getElementById("results-download-error");

const initializedCheckmark = document.getElementById("initialized-check");
const initializedDropdown = document.getElementById("initialized-dropdown");
const dropdownButton = document.getElementById("dropdownMenuButton2");

const docbody = document.body;

const refreshUser = (iexec) => async () => {
    const userAddress = await iexec.wallet.getAddress();
    const [wallet, account] = await Promise.all([
        iexec.wallet.checkBalances(userAddress),
        iexec.account.checkBalance(userAddress)
    ]);
    const nativeWalletText = `Native : ${utils.formatEth(wallet.wei).substring(0, 6)} RLC`;
    const rlcWalletText = `${utils.formatRLC(wallet.nRLC)} RLC`;
    addressOutput.innerText = userAddress;
    nativeWalletOutput.innerHTML = nativeWalletText;
    accountOutput.innerText = `Wallet : ${account.stake} nRLC`;
};

const checkStorage = (iexec) => async () => {
    try {
        storageCheckOutput.innerText = "";
        storageCheckError.innerText = "";
        const isStorageInitialized = await iexec.storage.checkStorageTokenExists(
            await iexec.wallet.getAddress()
        );
        storageCheckOutput.innerText = isStorageInitialized ?
            "Initialized" :
            "Not initialized";
        if (isStorageInitialized) {initializedCheckmark.hidden=false};
    } catch (error) {
        storageCheckError.innerText = error.message;
    }
};

const initStorage = (iexec) => async () => {
    try {
        storageInitButton.disabled = true;
        storageInitError.innerText = "";
        const storageToken = await iexec.storage.defaultStorageLogin();
        await iexec.storage.pushStorageToken(storageToken, {
            forceUpdate: true
        });
        checkStorage(iexec)();
    } catch (error) {
        storageInitError.innerText = error;
    } finally {
        storageInitButton.disabled = false;
    }
};

const showApp = (iexec) => async () => {
    try {

        appsShowButton.disabled = true;
        docbody.classList.add("waiting");
        appsShowError.innerText = "";
        appsShowOutput.innerText = "";
        const appAddress = appsShowInput.value;
        const res = await iexec.app.showApp(appAddress);
        appsShowOutput.innerText = JSON.stringify(res, null, 2);
    } catch (error) {
        appsShowError.innerText = error;
        docbody.classList.remove("waiting");
    } finally {
        docbody.classList.remove("waiting");
        appsShowButton.disabled = false;
    }
};

const showWorkerpoolOrderbook = (iexec) => async () => {
    try {
        workerpoolOrderbookShowButton.disabled = true;
        docbody.classList.add("waiting");
        workerpoolOrderbookShowError.innerText = "";
        workerpoolOrderbookShowOutput.innerText = "";
        const workerpoolAddress = workerpoolOrderbookShowInput.value;
        const {
            orders
        } = await iexec.orderbook.fetchWorkerpoolOrderbook({workerpool:workerpoolAddress});
    
        if (orders[0] === undefined){
            workerpoolOrderbookShowOutput.innerText = "No order found for the given address."
        }else {
        workerpoolOrderbookShowOutput.innerText = JSON.stringify(orders[0], null, 2);
    }

    } catch (error) {
        workerpoolOrderbookShowError.innerText = error;
        docbody.classList.remove("waiting");
    } finally {
        workerpoolOrderbookShowButton.disabled = false;
        docbody.classList.remove("waiting");
    }
};

const showOrderbook = (iexec) => async () => {
    try {
        appOrderbookShowButton.disabled = true;
        docbody.classList.add("waiting");
        appOrderbookShowError.innerText = "";
        appOrderbookShowOutput.innerText = "";
        const appAddress = appOrderbookShowInput.value;
        const {
            orders
        } = await iexec.orderbook.fetchAppOrderbook(appAddress);
        if (orders[0] === undefined){
            appOrderbookShowOutput.innerText = "No order found for the given address."
        }else {
        appOrderbookShowOutput.innerText = JSON.stringify(orders[0], null, 2);
        }
    } catch (error) {
        appOrderbookShowError.innerText = error;
        docbody.classList.remove("waiting");
    } finally {
        appOrderbookShowButton.disabled = false;
        docbody.classList.remove("waiting");
    }
};

const buyComputation = (iexec) => async () => {
    try {
        buyBuyButton.disabled = true;
        buyBuyError.innerText = "";
        buyBuyOutput.innerText = "";
        docbody.classList.add("waiting");
        const appAddress = buyAppAddressInput.value;
        const category = buyCategoryInput.value;
        const params = buyParamsInput.value;
        const workerpool = buyWorkerpoolInput.value;
        const trustLevel = buyTrustInput.value;
        const {
            orders
        } = await iexec.orderbook.fetchAppOrderbook(appAddress);
        const appOrder = orders && orders[0] && orders[0].order;
        if (!appOrder) throw Error(`no apporder found for app ${appAddress}`);

        const workerPoolRes = await iexec.orderbook.fetchWorkerpoolOrderbook(
            {workerpool: workerpool,
            category: category,
            minTrust : trustLevel}
        );
        const workerPoolOrders = workerPoolRes.orders;
        const workerpoolOrder =
        workerPoolOrders && workerPoolOrders[0] && workerPoolOrders[0].order;
        if (!workerpoolOrder)
            throw Error(`no workerpoolorder found for the selected options: category ${category}, trust level ${trustLevel}`);

        const userAddress = await iexec.wallet.getAddress();

        const requestOrderToSign = await iexec.order.createRequestorder({
            app: appAddress,
            appmaxprice: appOrder.appprice,
            workerpoolmaxprice: workerpoolOrder.workerpoolprice,
            requester: userAddress,
            workerpool: workerpool,
            volume: 1,
            params: params,
            trust: trustLevel,
            category: category
        });

        const requestOrder = await iexec.order.signRequestorder(requestOrderToSign);

        const res = await iexec.order.matchOrders({
            apporder: appOrder,
            requestorder: requestOrder,
            workerpoolorder: workerpoolOrder
        });
        buyBuyOutput.innerText = JSON.stringify(res, null, 2);
        resultsDealidInput.value = res.dealid;
        refreshUser(iexec)();
    } catch (error) {
        buyBuyError.innerText = error;
        docbody.classList.remove("waiting");
    } finally {
        buyBuyButton.disabled = false;
        docbody.classList.remove("waiting");
    }
};

const showDeal = (iexec) => async () => {
    try {
        resultsShowDealButton.disabled = true;
        docbody.classList.add("waiting");
        resultsShowDealError.innerText = "";
        resultsShowDealOutput.innerText = "";
        const dealid = resultsDealidInput.value;
        const deal = await iexec.deal.show(dealid);
        resultsShowDealOutput.innerText = JSON.stringify(deal, null, 2);
        resultsTaskidInput.value = deal.tasks["0"];
        resultsDownloadInput.value = deal.tasks["0"];
    } catch (error) {
        resultsShowDealError.innerText = error;
        docbody.classList.remove("waiting");
    } finally {
        resultsShowDealButton.disabled = false;
        docbody.classList.remove("waiting");
    }
};

const showTask = (iexec) => async () => {
    try {
        resultsShowTaskButton.disabled = true;
        docbody.classList.add("waiting");
        resultsShowTaskError.innerText = "";
        resultsShowTaskOutput.innerText = "";
        const taskid = resultsTaskidInput.value;
        const res = await iexec.task.show(taskid);
        resultsShowTaskOutput.innerText = JSON.stringify(res, null, 2);
    } catch (error) {
        resultsShowTaskError.innerText = error;
        docbody.classList.remove("waiting");
    } finally {
        resultsShowTaskButton.disabled = false;
        docbody.classList.remove("waiting");
    }
};

const dowloadResults = (iexec) => async () => {
    try {
        resultsDownloadButton.disabled = true;
        docbody.classList.add("waiting");
        resultsDownloadError.innerText = "";
        const taskid = resultsDownloadInput.value;
        const res = await iexec.task.fetchResults(taskid, {
            ipfsGatewayURL: "https://ipfs.iex.ec"
        });
        const file = await res.blob();
        const fileName = `${taskid}.zip`;
        if (window.navigator.msSaveOrOpenBlob)
            window.navigator.msSaveOrOpenBlob(file, fileName);
        else {
            const a = document.createElement("a");
            const url = URL.createObjectURL(file);
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    } catch (error) {
        resultsDownloadError.innerText = error;
        docbody.classList.remove("waiting");
    } finally {
        resultsDownloadButton.disabled = false;
        docbody.classList.remove("waiting");
    }
};

const init = async () => {
    try {
        docbody.classList.add("waiting");
        let ethProvider;

        ethereum.on('chainChanged', () => {
            document.location.reload()
          })


        if (window.ethereum) {
            console.log("using default provider");
            ethProvider = window.ethereum;
        }

        let networkmap = new Map([
            [133, "Viviani Sidechain"],
            [134, "Bellecour Sidechain"]
        ]);

        await ethProvider.enable();

        const {
            result
        } = await new Promise((resolve, reject) =>
            ethProvider.sendAsync({
                    jsonrpc: "2.0",
                    method: "net_version",
                    params: []
                },
                (err, res) => {
                    if (!err) resolve(res);
                    reject(Error(`Failed to get network version from provider: ${err}`));
                }
            )
        );
        const networkVersion = result;

        if (networkmap.get(parseInt(networkVersion)) == undefined) {
            const error = `Unsupported network ${networkVersion}`;
            storageInitButton.innerText = "Unsupported network";
            networkOutput.innerText = error;
            
            storageInitButton.disabled = true;
            appsShowButton.disabled = true;
            workerpoolOrderbookShowButton.disabled = true;
            appOrderbookShowButton.disabled = true;
            buyBuyButton.disabled = true;
            initializedDropdown.hidden = true;
            resultsShowDealButton.disabled = true;
            resultsShowTaskButton.disabled = true;
            resultsDownloadButton.disabled = true;
            dropdownButton.disabled = true;


            throw Error(error);
        }

        networkOutput.innerText = networkmap.get(parseInt(networkVersion));

        const iexec = new IExec({
            ethProvider,
            chainId: networkVersion
        });

        await refreshUser(iexec)();
        await checkStorage(iexec)();


        storageInitButton.addEventListener("click", initStorage(iexec));
        appsShowButton.addEventListener("click", showApp(iexec));
        appOrderbookShowButton.addEventListener("click", showOrderbook(iexec));
        workerpoolOrderbookShowButton.addEventListener("click", showWorkerpoolOrderbook(iexec));
        buyBuyButton.addEventListener("click", buyComputation(iexec));

        resultsShowDealButton.addEventListener("click", showDeal(iexec));
        resultsShowTaskButton.addEventListener("click", showTask(iexec));
        resultsDownloadButton.addEventListener("click", dowloadResults(iexec));

        storageInitButton.disabled = false;
        appsShowButton.disabled = false;
        workerpoolOrderbookShowButton.disabled = false;
        appOrderbookShowButton.disabled = false;
        buyBuyButton.disabled = false;
        initializedDropdown.hidden = false;
        resultsShowDealButton.disabled = false;
        resultsShowTaskButton.disabled = false;
        resultsDownloadButton.disabled = false;
        dropdownButton.disabled = false;
        docbody.classList.remove("waiting");
    } catch (e) {
        console.error(e.message);
        docbody.classList.remove("waiting");
    }
};

init();
