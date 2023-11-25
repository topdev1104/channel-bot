const Web3 = require('web3');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
const coinMarketApi = '0fc76be4-e648-49d3-8e8a-d09b758bc675';
const coinUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?symbol=&`;
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
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

  



    const getTokenStatusFor20s = async (tokenAddress) => {
        bananaGunCount = 0
        mastroCount = 0;
        // Set timeout of 20s
        const timeout = 20 * 1000;
      
        // Track start time
        const startTime = Date.now();
        console.log('new token:',startTime,"tokenAddress===>",tokenAddress);
        return new Promise((resolve, reject) => {
      
          // Subscribe to logs
          const subscription = web3.eth.subscribe('logs', {
            address: tokenAddress
          });
      
          subscription.on('data', async (blockHeader) => {
            const tx = await getTransactionReceipt(blockHeader.transactionHash);
            if(tx?.to?.toLowerCase() === BananaGunRouter.toLowerCase()){
                bananaGunCount ++;   
                console.log('BananaGunRouter');
            }
            if(tx?.to?.toLowerCase() === mastroRouter.toLowerCase()){
                console.log('mastroRouter');
                mastroCount ++;
            }
          });
      
          // Handle timeout
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(); // resolve promise
          }, timeout);
      
        }).then(async() => {
            console.log(bananaGunCount , mastroCount,'bananaGunCount + mastroCount');
            await getTokenInfos(tokenAddress, async function (result, result2) {

                console.log(result.data[0].items,'2222');
                const symbol = result.data[0]?.contract_ticker_symbol;
                
                const keyboard = [
                    [
                    {text: 'Dexscreener', url: `https://dexscreener.com/ethereum/${tokenAddress}`},
                    {text: 'dextools', url: `https://www.dextools.io/app/en/ether/pair-explorer/${tokenAddress}`},
                    ]
                ];
bot.sendMessage(channelId,
    `
    \n🎯 Hard Sniped Alert
    
🪙 ${symbol} <a href="etherscan.io/token/${tokenAddress}">${symbol}</a>
💰Total Supply:<code>1000000000 (18 decimals)</code>

🫧 Socials: No link available

🌀 Hard Sniped ${bananaGunCount+mastroCount} times in less than 20 secs

🍌Banana: ${bananaGunCount}
🤖Mastro: ${mastroCount}
📈 Volume: $0
💰 Mcap: $0
💧 Liquidity: $0

CA: <code>${tokenAddress}</code>
    `,{
        parse_mode:'HTML',
        disable_web_page_preview: true,
        reply_markup: JSON.stringify({
            inline_keyboard: keyboard
        })
    
    }
);
                if(bananaGunCount + mastroCount >= 10){
                    // bananaGunCount = 0;
                    // mastroCount = 0;
                }
            })
          // Calculate elapsed time
          // Resolve once timeout reached
        });
      
    }// Repeat the above process for each exchange you want to monitor
    
    uniswapFactoryContract.events.PairCreated({}, async (error, event) => {
        console.log(Date.now(),'-----');
        console.log(event,'event');
        const pair = event.returnValues;
        const token0 = pair?.token0?.toLowerCase();
        const token1 = pair?.token1?.toLowerCase();
        wethAddress = wethAddress.toLowerCase();
        daiAddress = daiAddress.toLowerCase();
        let tokenAddr = token0;

        if(token0 == wethAddress || token0 == daiAddress){
            tokenAddr = token1
        }        
        if(token1 == wethAddress || token1 == daiAddress){
            tokenAddr = token0
        }
        
        await tokenTxPerMins(tokenAddr,Date.now())
        // await getTokenStatusFor20s(tokenAddr)
    });
    uniswapV3FactoryContract.events.PoolCreated({},async (error,event)=>{
        const pair = event.returnValues;
        const token0 = pair.token0?.toLowerCase();
        const token1 = pair.token1?.toLowerCase();
        wethAddress = wethAddress.toLowerCase();
        daiAddress = daiAddress.toLowerCase();
        let tokenAddr = token0;

        if(token0 == wethAddress || token0 == daiAddress){
            tokenAddr = token1
        }        
        if(token1 == wethAddress || token1 == daiAddress){
            tokenAddr = token0
        }
        
        await tokenTxPerMins(tokenAddr,Date.now())
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

    var query = `
    query{
        EVM(dataset: combined, network: eth) {
          burn: Transfers(
            where: {Transfer: {Currency: {SmartContract: {is: "${tokenAddress}"}}, Receiver: {is: "0x0000000000000000000000000000000000000000"}, Amount: {gt: "0"}}}
          ) {
            sum(of: Transfer_Amount)
          }
          mint: Transfers(
            where: {Transfer: {Currency: {SmartContract: {is: "${tokenAddress}"}}, Sender: {is: "0x0000000000000000000000000000000000000000"}, Amount: {gt: "0"}}}
          ) {
            sum(of: Transfer_Amount)
          }
          BalanceUpdates(
            where: {Currency: {SmartContract: {is: "${tokenAddress}"}}}
            limit: {count: 1}
          ) {
            Currency {
              Decimals
              Name
              Symbol
              ProtocolName
              SmartContract
              HasURI
              Fungible
            }
            ChainId
          }
        }
      }
    `;
    var data = JSON.stringify({query});

    var config = {
        method: 'post',
        url: 'https://streaming.bitquery.io/graphql',
        headers: { 
            'Content-Type': 'application/json', 
            'X-API-KEY': 'BQYUWG8NvrMJ96Qmuqjq6mPLLPFG48Dr'
        },
        data : data
    };
    axios.all([
        axios.get(url),
        axios(config)
    ]).then(axios.spread((res1, res2) => {
        return callback(res1.data, res2.data);
    }))
    .catch(error => {
        // console.log(error, '333333333333333');
        return callback(false);
    })
}

// (async()=>{
//     await getTokenInfos("0x14f6d9bdd60b47948d31b088cfc35e862a8d2f0a", async function (result, result2) {
//         const pairs = result?result?.pairs[0] : {priceUsd:0,liquidity:{usd:0},volume:{h24:0}};
//         const tokenPrice = pairs?.priceUsd;
//         const tokenLq = pairs?.liquidity?.usd;
//         const tokenVolumn = pairs?.volume?.h24;
//         const totalSupply  = result2?.data?.EVM?.mint[0]?.sum || 0
//         const decimals  = result2?.data?.EVM?.BalanceUpdates[0]?.Currency?.Decimals || 0
//         const marketCap = parseInt(totalSupply)*parseFloat(tokenPrice);
//     })
// })()





const checkPair = (pair) => {
    for (var i = 0; i < pairsList.length; i++) {
        if (Object.keys(pairsList[i]).includes(pair)) {
            return true;
        }
    }
    return false;
}

const tokenTxPerMins = async(tokenAddress,date)=>{
    setTimeout(() => {
        var query = `
        query {
            EVM(network: eth, dataset: combined) {
              Transfers(
                where: {Transfer: {Currency: {SmartContract: {is: "${tokenAddress}"}}}}
                orderBy: {descending: Block_Time}
              ) {
                Transfer {
                  Amount
                  Currency {
                    Symbol
                    SmartContract
                  }
                }
                Block {
                  Number
                  Time
                }
                Transaction {
                  Hash
                  To
                }
              }
            }
          }
          
          
        `;
        var data = JSON.stringify({query});

        var config = {
            method: 'post',
            url: 'https://streaming.bitquery.io/graphql',
            headers: { 
                'Content-Type': 'application/json', 
                'X-API-KEY': 'BQYUWG8NvrMJ96Qmuqjq6mPLLPFG48Dr'
            },
            data : data
        };
        var startTimeStamp = new Date(date);
        startTimeStamp.setSeconds(startTimeStamp.getSeconds()-5);

        var endTimeStamp = new Date();
        endTimeStamp.setSeconds(startTimeStamp.getSeconds()+20);

        axios(config)
            .then(async function (response) {
                var transfers = response?.data?.data?.EVM?.Transfers;
                var filteredTransfer = transfers.filter(data=> new Date(data?.Block?.Time).valueOf() >= startTimeStamp.valueOf() && new Date(data?.Block?.Time).valueOf() <= endTimeStamp.valueOf())
                var bananaTrx = {};
                
                const groupedData = filteredTransfer.reduce((acc, item) => {
                    const existingItem = acc.find(i => i.Transaction.Hash === item.Transaction.Hash);
                    if (!existingItem) {
                      acc.push(item);
                    }
                    return acc;
                  }, []);
                const bananaCount = groupedData.filter(data=> data?.Transaction?.To?.toLowerCase() === BananaGunRouter).length;
                const mastroCount = groupedData.filter(data=> data?.Transaction?.To?.toLowerCase() === mastroRouter).length;
                  console.log(groupedData,groupedData.length,bananaCount,mastroCount,'--');
                await getTokenInfos(tokenAddress, async function (result, result2) {
                    
                    const pairs = result?result?.pairs[0] : {priceUsd:0,liquidity:{usd:0},volume:{h24:0}};
                    const tokenPrice = pairs?.priceUsd || 0;
                    const tokenLq = pairs?.liquidity?.usd || 0;
                    const tokenVolumn = pairs?.volume?.h24 || 0;
                    const totalSupply  = result2?.data?.EVM?.mint[0]?.sum || 0
                    const decimals  = result2?.data?.EVM?.BalanceUpdates[0]?.Currency?.Decimals || 0
                    const marketCap = parseInt(totalSupply)*parseFloat(tokenPrice);
                    const symbol = result2?.data?.EVM?.BalanceUpdates[0]?.Currency?.Symbol;
                    const tokenName = result2?.data?.EVM?.BalanceUpdates[0]?.Currency?.Name;
                    if(bananaCount + mastroCount >= 10){
                    
                    const keyboard = [
                        [
                        {text: 'Dexscreener', url: `https://dexscreener.com/ethereum/${tokenAddress}`},
                        {text: 'dextools', url: `https://www.dextools.io/app/en/ether/pair-explorer/${tokenAddress}`},
                        ]
                    ];
    bot.sendMessage(channelId,
        `
        \n🎯 Hard Sniped Alert
        
    🪙 ${tokenName} <a href="etherscan.io/token/${tokenAddress}">${symbol}</a>
    💰Total Supply:<code>${totalSupply} (${decimals} decimals)</code>
    
    🫧 Socials: No link available
    🌀 Hard Sniped ${bananaCount+mastroCount} times in less than 20 secs
    
    🍌Banana: ${bananaCount}
    🤖Mastro: ${mastroCount}
    📈 Volume: $${tokenVolumn}
    💰 Mcap: $${marketCap}
    💧 Liquidity: $${tokenLq}
    
    CA: <code>${tokenAddress}</code>
        `,{
            parse_mode:'HTML',
            disable_web_page_preview: true,
            reply_markup: JSON.stringify({
                inline_keyboard: keyboard
            })
        
        }
    );

                    }
                })


               
                
            })
            .catch(function (error) {
                console.log(error);
            });
    },[
        1000*20
    ]);
}
const getHoldersPer5m = async (tokenAddress, pairAddress /*address */, minutes /** minutes */, index /**index */) => {

    setTimeout(() => {
        console.log(tokenAddress, pairAddress /*address */, minutes /** minutes */, index /**index */);
        const apiKey = "cqt_rQfBvGFQfc4vy9wmGTJqHVF4KfPH";
        const url2 = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${tokenAddress}/token_holders_v2/`
        axios.get(url2, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        })
            .then(res => {
                result = res.data.data;
                var itemIndex = pairsList.findIndex(item => Object.keys(item)[0] == pairAddress);
                if (itemIndex != -1) { pairsList[itemIndex][pairAddress][index] = result.pagination.total_count; }
                io.emit("updatePair", { min_index: index, min_value: result.pagination.total_count, addr: tokenAddress })

                // pairsList.map((obj, _in) => {
                //     if (Object.keys(obj)[0] == pairAddress) {

                //         pairsList[_in][tokenAddress][index] = result.pagination.total_count;
                //         // Object.values(obj)[0][index] = result.pagination.total_count;
                //     }
                // })
                // return res.data;
            })
            .catch(error => {

                return false;
            })
    }, 1000 * 60 * minutes);

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
                'X-API-KEY': 'BQYUWG8NvrMJ96Qmuqjq6mPLLPFG48Dr'
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
