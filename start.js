const Web3 = require('web3');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
const coinMarketApi = '0fc76be4-e648-49d3-8e8a-d09b758bc675';
const coinUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=&`;
const Moralis = require("moralis").default;
const { EvmChain, EvmChainParser } = require("@moralisweb3/common-evm-utils");
const BananaGunRouter = '0xdB5889E35e379Ef0498aaE126fc2CCE1fbD23216'.toLowerCase(); // Replace with the actual token contract address
const mastroRouter = '0x80a64c6D7f12C47B7c66c5B4E20E72bc1FCd5d9e'.toLowerCase(); // Replace with the actual token contract address
let wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH token address
let daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI token address

const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = '6112767589:AAFHp2BGLOw3xplRiFtBlIiX4PYaphdtnzk';

const providerUrl = 'wss://mainnet.infura.io/ws/v3/3420579b4eb641de9cca55a9f72687b4';
const web3 = new Web3(providerUrl);

// Define the smart contract ABI and address of each exchange you want to monitor:
const uniswapEthAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const uniswapV3EthAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const uniswapEthABI = require('./uniswapV2.json');
const uniswapV3ABI = require('./uniswapV3.json');
const uniswapFactoryContract = new web3.eth.Contract(uniswapEthABI, uniswapEthAddress);
const uniswapV3FactoryContract = new web3.eth.Contract(uniswapV3ABI, uniswapV3EthAddress);

const channelId = "-1002006529312";
const bot = new TelegramBot(BOT_TOKEN, {
    polling: true,
  });

  
let bananaGunCount = 0;
let mastroCount = 0;

bot.getChat('@HardSnipe')
  .then(chat => {
    const channelId = chat.id; 
    console.log(channelId,'33333333');
  });

bot.setChatTitle(channelId,"Hard Snipe Alert Bot 🎯")
uniswapFactoryContract.events.PairCreated({}, async (error, event) => {
    console.log(Date.now(),'-----');
    console.log(event,'event');
    const pair = event.returnValues;
    const token0 = pair?.token0?.toLowerCase();
    const token1 = pair?.token1?.toLowerCase();
    const pairAddress = pair?.pair?.toLowerCase();
    wethAddress = wethAddress.toLowerCase();
    daiAddress = daiAddress.toLowerCase();
    let tokenAddr = token0;

    if(token0 == wethAddress || token0 == daiAddress){
        tokenAddr = token1
    }        
    if(token1 == wethAddress || token1 == daiAddress){
        tokenAddr = token0
    }
    
    await tokenTxPerMins(tokenAddr,pairAddress,Date.now())
    // await getTokenStatusFor20s(tokenAddr)
});
uniswapV3FactoryContract.events.PoolCreated({},async (error,event)=>{
    const pair = event.returnValues;
    const token0 = pair?.token0?.toLowerCase();
    const token1 = pair?.token1?.toLowerCase();
    const pairAddress = pair?.pair?.toLowerCase();

    wethAddress = wethAddress.toLowerCase();
    daiAddress = daiAddress.toLowerCase();
    let tokenAddr = token0;

    if(token0 == wethAddress || token0 == daiAddress){
        tokenAddr = token1
    }        
    if(token1 == wethAddress || token1 == daiAddress){
        tokenAddr = token0
    }
    
    await tokenTxPerMins(tokenAddr,pairAddress,Date.now())
    // await getTokenStatusFor20s(tokenAddr)

})
// Connect to an Ethereum node

let pairsList = [];

// Listen for new pair creation events on Uniswap (ETH)



const getTokenInfos = async (tokenAddress, callback) => {

    console.log(tokenAddress, 'tokenAddress')
    // setTimeout(async () => {
    // let response;
    const apiKey = "cqt_rQfBvGFQfc4vy9wmGTJqHVF4KfPH";
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`

    const url2 = `https://open-api.dextools.io/free/v2/token/ether/${tokenAddress}`
    const url3 = `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${tokenAddress}`
    var config = {
        method: 'GET',
        headers: {
            'X-BLOBR-KEY': 'GzIhefgibxjzVesFk75lr09yJLIcIxDv'
          },
        url: url2,
    };
    
    var config3 = {
        method: 'GET',
        url: url3,
    };

    axios.all([
        axios.get(url),
        axios(config),
        axios(config3),
    ]).then(axios.spread((res1, res2,res3) => {
        console.log(res2.data);
        return callback(res1.data, res2?.data,res3?.data);
    }))
    .catch(error => {
        console.log(error, '333333333333333');
        return callback(false);
    })
}







const checkPair = (pair) => {
    for (var i = 0; i < pairsList.length; i++) {
        if (Object.keys(pairsList[i]).includes(pair)) {
            return true;
        }
    }
    return false;
}

const tokenTxPerMins = async(tokenAddress,pairAddress,date)=>{
    setTimeout(async () => {
        var startTimeStamp = new Date(date);
        startTimeStamp.setSeconds(startTimeStamp.getSeconds()-5);

        var endTimeStamp = new Date();
        endTimeStamp.setSeconds(startTimeStamp.getSeconds()+20);

        try {            
            const {data:_tx_data} = await getTransactionsByPair(pairAddress)
            var filteredTransfer = _tx_data.filter(item=> new Date(item?.attributes?.block_timestamp).valueOf() >= startTimeStamp.valueOf() && new Date(item?.attributes?.block_timestamp).valueOf() <= endTimeStamp.valueOf())
            const groupedData = filteredTransfer.reduce((acc, item) => {
                const existingItem = acc.find(i => i.attributes.tx_hash === item.attributes.tx_hash);
                if (!existingItem) {
                  acc.push(item);
                }
                return acc;
            }, []);
            for(var i = 0 ; i < groupedData.length; i++){
                const tx_hash = groupedData[i].attributes.tx_hash;
                const tx = await getTransactionReceipt(tx_hash);
                groupedData[i]['_to'] = tx?.to;
            }
            console.log(JSON.parse(JSON.stringify(groupedData)));
            const bananaCount = JSON.parse(JSON.stringify(groupedData)).filter(_data=> _data?._to?.toLowerCase() === BananaGunRouter).length;
            const mastroCount = JSON.parse(JSON.stringify(groupedData)).filter(_data=> _data?._to?.toLowerCase() === mastroRouter).length;
            console.log(bananaCount,mastroCount,'bananaCount,mastroCount');
            if(bananaCount+mastroCount >= 20){
                try {
                    
                    await getTokenInfos(tokenAddress, async function (result, result2,result3) {
                        try {
                            
                            const {data:tokenInfos} = result3;
                            const socialLinks = result2?.data?.socialInfo;
                            var social_links = '';
                            var social_link_status = false;
                            for(var _key in socialLinks){
                                if(socialLinks[_key]){
                                    social_link_status = true;
                                    social_links += `<a href="${socialLinks[_key]}">${_key}</a> | `;
                                }
                            }
            
                            const pairs = result?(result?.pairs[0]) : {priceUsd:0,liquidity:{usd:0},volume:{h24:0}};
                            const tokenPrice = tokenInfos?.attributes?.price_usd || pairs?.priceUsd || 0;
                            const tokenLq = (pairs?.liquidity?.usd || 0).toFixed(2);
                            const tokenVolumn = (pairs?.volume?.h24 || 0).toFixed(2);
                            const totalSupply  = (tokenInfos?.attributes?.total_supply/Math.pow(10,tokenInfos?.attributes?.decimals) || 0)
                            const decimals  = tokenInfos?.attributes?.decimals || 0
                            const marketCap = (parseInt(totalSupply)*parseFloat(tokenPrice)).toFixed(2);
                            const symbol = tokenInfos?.attributes?.symbol || pairs?.baseToken?.symbol;
                            const tokenName = tokenInfos?.attributes?.name || pairs?.baseToken?.name;
                            const {pagination} =  await getHoldersByContractAddress(tokenAddress);
                            const tokenHolders = pagination.total_count || 0
                            console.log({tokenPrice,tokenLq,tokenVolumn,totalSupply,decimals,marketCap,symbol,tokenName});
                            const keyboard = [
                                [
                                    {text: 'Etherscan', url: `https://etherscan.io/token/${tokenAddress}`},
                                    {text: 'dextools', url: `https://www.dextools.io/app/en/ether/pair-explorer/${tokenAddress}`},
                                    {text:"Snipe",url:`https://t.me/blazexswapbot`}
                                ]
                            ];
                            var no_social_link = "No link available"
        return bot.sendMessage(channelId,
    `
🚨 Alert: Sniper Action! 🚨

🎯 Massive Snipes Detected:
<em>${bananaCount+mastroCount} times in less than 20 secs</em>
🍌 Banana: <em>${bananaCount}</em>
🤖 Mastro: <em>${mastroCount}</em>

Token: ${tokenName}
Total Supply:${totalSupply}

🫧 Socials: ${social_link_status ? social_links : no_social_link}

👥 Holders: <em>${tokenHolders}</em>
📈 Volume:  <em>$${tokenVolumn}</em>
💰 Mcap: <em>$${marketCap}</em>
💧 Liquidity: <em>$${tokenLq}</em>

Contract Address: <code>${tokenAddress}</code>`,{
            parse_mode:'HTML',
            disable_web_page_preview: true,
            reply_markup: JSON.stringify({
                inline_keyboard: keyboard
            })
        });
                        } catch (error) {
                            console.log(error,'2222222222');
                        }
                    });
                } catch (error) {
                    console.log(error,'1111');
                }
            }
        } catch (error) {
            console.log(error,'34343');
        }
    },[
        1000*40
    ]);
}
const getHoldersByContractAddress = async (tokenAddress) => {

    const apiKey = "cqt_rQfBvGFQfc4vy9wmGTJqHVF4KfPH";
    const url2 = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${tokenAddress}/token_holders_v2/`
    return  await axios.get(url2, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }
    })
    .then(res => {
        return res.data.data || {pagination:{total_count:0}}
    })
    .catch(error=>{
        return {pagination:{total_count:0}};
    })
}
const getTransactionsByPair = async (tokenAddress) => {

    var url = `https://api.geckoterminal.com/api/v2/networks/eth/pools/${tokenAddress}/trades?trade_volume_in_usd_greater_than=0`

    var config = {
        method: 'get',
        url: url,
    };
    const res = await axios(config);
    return res?.data
}

const getTxsper5m = async (tokenAddress, pairAddress, minutes, index) => {

    setTimeout(() => {
        console.log(tokenAddress, minutes, '333333333334444');
        var query = `
            query {
                ethereum(network: ethereum) {
                
                transfers(currency: {is: "${tokenAddress}"}) {
                    count
                }
                }
            }
            `
        var data = JSON.stringify({ query });

        var config = {
            method: 'post',
            url: 'https://graphql.bitquery.io',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': 'BQYXzYlNQugCYxFQ3xA2KEWmQNVx2FI6'
            },
            data: data
        };
        axios(config)
            .then(res => {
                var result = res.data.data.ethereum.transfers[0].count;

                console.log(result, '343434334343')
                var itemIndex = pairsList.findIndex(item => Object.keys(item)[0] == pairAddress);
                if (itemIndex != -1) { pairsList[itemIndex][pairAddress][index] = result; }

                io.emit("updatePair", { min_index: index, min_value: result, addr: tokenAddress })

                // pairsList.map((obj, _in) => {
                //     if (Object.keys(obj)[0] == pairAddress) {
                //         console.log(result.pagination.total_count, 'result.pagination.total_count;')
                //         pairsList[_in][tokenAddress][index] = result.pagination.total_count;
                //         // console.log(Object.values(obj)[0][index], 'Object.values(obj)[0][_index]');
                //         // Object.values(obj)[0][index] = result.pagination.total_count;
                //     }
                // })
            }).catch(error => {
                console.log(error);
            })
    }, 1000 * 60 * minutes);
}

const getCoinPrice = (tokenAddress, pairAddress, minutes, index) => {

    setTimeout(() => {

        const apiKey = "6yQovJ4FlVFcu4o6rSmnPbCsIXgpM62X9vY8xHFfB3I1d2xKmwBTCs9hM9ky3hSp";
        const url = `https://deep-index.moralis.io/api/v2/erc20/${tokenAddress}/price?chain=eth&include=percent_change`
        axios.get(url, {
            headers: {
                'accept': 'application/json',
                'X-API-Key': `${apiKey}`
            }
        })
            .then(res => {
                var price = res.data.usdPrice;
                var itemIndex = pairsList.findIndex(item => Object.keys(item)[0] == pairAddress);
                if (itemIndex != -1) { pairsList[itemIndex][pairAddress][index] = price; }
                io.emit("updatePair", { min_index: index, min_value: price, addr: tokenAddress })
            })
            .catch(error => {

            })
    }, 1000 * 60 * minutes)
}

async function getTransactionReceipt(tx) {
    return await web3.eth.getTransactionReceipt(tx);
}


// const subscription = web3.eth.subscribe('logs', {
//     address: "0xdb044d60a12b083f0d3795068a91df9f13c5cb4a"
//   });

//   subscription.on('data', async (blockHeader) => {
//     const tx = await getTransactionReceipt(blockHeader.transactionHash);
//     console.log(tx.to,'--------');
//     if(tx.to.toLowerCase() === BananaGunRouter.toLowerCase()){
//         bananaGunCount ++;   
//         console.log('BananaGunRouter');
//     }
//     if(tx.to.toLowerCase() === mastroRouter.toLowerCase()){
//         console.log('mastroRouter');
//         mastroCount ++;
//     }
//   });

// Create an express app and server
const app = express();
const server = http.createServer(app);

// Set up socket.io
const io = new Server(server);

// Serve the HTML file and listen for incoming client connections
app.use(express.static('public'));
app.set('views', './views'); // Set the view engine for templating
app.set('view engine', 'ejs'); // Set the view engine for templating
app.set()
app.get('/', (req, res) => {
    res.render(`index`);
})
io.on('connection', (socket) => {
    console.log('New client connected');

    // Send the initial pairs list to the client
    socket.emit('pairsList', { pairs: pairsList });
});

// Start the server
const port = 4040;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


(async()=>{

    // console.log(ddd,'---');
})()