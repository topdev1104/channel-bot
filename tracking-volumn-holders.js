const Web3 = require('web3');
const express = require('express');
const http = require('http');
const axios = require('axios');
let wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH token address
let daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI token address

const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = '6758159195:AAHg4zwWR-2nJ-od29qicBMLrSy7Lf4rT3w';

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
const channelId1 = "-1002088905227"
const bot = new TelegramBot(BOT_TOKEN, {
polling: true,
});


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
    
    checkMassiveVolumnAndHoldersByContractAddress(tokenAddr,pairAddress)
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
    checkMassiveVolumnAndHoldersByContractAddress(tokenAddr,pairAddress)

})

const checkMassiveVolumnAndHoldersByContractAddress = async(tokenAddress,pairAddress)=>{
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    
    setTimeout(async() => {
        var social_links = '';
        var social_link_status = false;
        const [massiveHolders,holders] = await getMassiveHoldersByContractAddress(tokenAddress);
        console.log(holders,tokenAddress,'holders,tokenAddress');
        const {telegramUrl,twitterUrl,websiteUrl} = await getSocialLinksByContractAddress(tokenAddress);
        const {name,symbol,price_usd,total_supply,token_mc,decimals} = await getTokenSupply(tokenAddress);
        var no_social_link = "No link available"
        if(telegramUrl){
            social_links += `<a href="${telegramUrl}">Telegram</a> | `
            social_link_status = true;
        }
        if(twitterUrl){
            social_links += ` <a href="${twitterUrl}">Twitter</a> | `
            social_link_status = true;
        }
        if(websiteUrl){
            social_links += ` <a href="${websiteUrl}">Website</a>`
            social_link_status = true
        }

        axios.get(url)
        .then(({data})=>{
            console.log(data,);
            const pairs = data?.pairs || [{volume:{m5:0},liquidity:{usd:0}}];
            const volumnFor5m = parseFloat(pairs[0]?.volume?.m5);
            const tokenLq = pairs[0]?.liquidity?.usd;

        if(volumnFor5m >= 10000){
            const tokenInfo = pairs[0].baseToken
            const keyboard = [
                [
                    {text: 'Etherscan', url: `https://etherscan.io/token/${tokenAddress}`},
                    {text: 'Dextools', url: `https://www.dextools.io/app/en/ether/pair-explorer/${tokenAddress}`},
                    {text:"Snipe",url:`https://t.me/blazexswapbot`}
                ]
            ];

            var massiveWallets = ''
            for(var i = 0 ; i< massiveHolders?.length;i++){
                massiveWallets+= `<code>${massiveHolders[i]}</code>\n`
            }
        
            if(massiveHolders.length >= 5){
return bot.sendMessage(channelId,`
🚨 Alert: High Volume Detected! 🚨

🎯Massive Volume Detected over 10K$ Volume in first 5 minutes:

Token: ${tokenInfo.name || name}
Total Supply:${total_supply}

🫧 Socials: ${social_link_status?social_links:no_social_link}

👥 Holders: ${holders}
📈 Volumn: <em>$${volumnFor5m}</em>
💰 Mcap: <em>$${token_mc}</em>
💧 Liquidity: <em>$${tokenLq}</em>

Contract Address:<code>${tokenAddress}</code>

🎯Massive Wallet Buy Detected in the first 5 minutes

${massiveWallets}
`,{
    parse_mode:'HTML',
    disable_web_page_preview: true,
    reply_markup: JSON.stringify({
        inline_keyboard: keyboard
    })
});
            }else{
return bot.sendMessage(channelId,`
🚨 Alert: High Volume Detected! 🚨

🎯Massive Volume Detected over 10K$ Volume in first 5 minutes:

🪙 Token: ${tokenInfo.name || name}
Total Supply:${total_supply}

🫧 Socials: ${social_link_status?social_links:no_social_link}

👥 Holders: ${holders}
📈 Volumn: <em>$${volumnFor5m}</em>
💰 Mcap: <em>$${token_mc}</em>
💧 Liquidity: <em>$${tokenLq}</em>

Contract Address:<code>${tokenAddress}</code>
`,{
    parse_mode:'HTML',
    disable_notification:true,
    reply_markup: JSON.stringify({
        inline_keyboard: keyboard
    })
});
            }
        }
    })
    .catch(error=>{
        console.log(error);
    })

    }, 1000 * 60 * 5);
}
const getMassiveHoldersByContractAddress = async(tokenAddress)=>{
    const options = {
        method: 'POST',
        url: 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/',
        params: {ankr_getTokenHolders: ''},
        headers: {accept: 'application/json', 'content-type': 'application/json'},
        data: {
            id: 1,
            jsonrpc: '2.0',
            method: 'ankr_getTokenHolders',
            params: {
                blockchain: 'eth',
                contractAddress: tokenAddress,
                // pageSize: 2
            }
        }
    };
    const _holders =  await axios.request(options)
    .then(function ({data}) {
        const holders = data.result.holders;
        const holderCount = data.result.holdersCount || 0
        return [holders || [] ,holderCount]
    })
    .catch(function (error) {
        return [[],0];
    });
    console.log(_holders[1],'ddddddd',tokenAddress);
    bot.sendMessage(channelId1,`
        ${tokenAddress}
        Holders:${_holders[1]}
    `);
    const holders = _holders[0];
    const massiveHolders =  [];
    const tokenPrice = await getTokenPrice(tokenAddress);
    for(var i = 0 ; i< holders.length;i++){
        const obj = holders[i];
        if(parseFloat(obj?.balance) * tokenPrice >= 1000 * 100){
            massiveHolders.push(obj?.holderAddress);
        }
    }
    return [massiveHolders,_holders[1]];
}
const getTokenPrice = async(tokenAddress)=>{
    const options = {
        method: 'POST',
        url: 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/',
        params: {ankr_getTokenPrice: ''},
        headers: {accept: 'application/json', 'content-type': 'application/json'},
        data: {
            jsonrpc: '2.0',
            method: 'ankr_getTokenPrice',
            params: {
                blockchain: 'eth',
                contractAddress: `${tokenAddress}`,
                syncCheck: false
            },
            id: 1
        }
    };
    const tokenPrice = await axios
        .request(options)
        .then(function ({data}) {
            const result = data?.result || {usdPrice:0}
            return parseFloat(result?.usdPrice);
        })
        .catch(function () {
            return {usdPrice:0}
        });

    return tokenPrice || 0;
}
const getTokenSupply = async(tokenAddress)=>{
    const url = `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${tokenAddress}`;
    var config = {
        method: 'GET',
        url: url,
    };
    const {data} = await axios(config)
    .then(({data})=>{
        return data;
    }).catch(error=>{
        return false;
    })
    if(data){
        const {attributes} = data;
        let {name,symbol,decimals,total_supply,price_usd} = attributes;
        total_supply = parseFloat(total_supply)/10**decimals;
        let token_mc = price_usd * total_supply;
        return {name,symbol,decimals,total_supply,price_usd,token_mc}
    }else{
        return {name:'',symbol:'',decimals:0,total_supply:0,price_usd:0,token_mc:1};
    }
}


// checkMassiveHoldersByContractAddress()

// Connect to an Ethereum node
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
        return callback(res1.data, res2?.data,res3?.data);
    }))
    .catch(error => {
        return callback(false,false,false);
    })
}
const getSocialLinksByContractAddress = (tokenAddress)=>{
    let config = {
        method: 'get',
        url: `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=QFWPKU6KKM7AKHU36Z3S1RDT5KY3V85N5C`,
    };
    return axios.request(config)
    .then(({data}) => {
        const text = data?.result[0].SourceCode
        if(text){
            const regex = /(http[s]?:\/\/[^\s]+)/g;
            const links = text.match(regex);
            const telegramRegex = /^https?:\/\/t\.me\//;
            const twitterRegex = /https:\/\/twitter\.com\/([^\/\n\s]+)/;
            let telegramUrl = false;
            let twitterUrl = false;
            const otherUrls = []
            console.log(links,'links');
            links.forEach(url => {
                if (telegramRegex.test(url)) {
                    telegramUrl = url.replace("\\n", "");;
                } else if (twitterRegex.test(url)) {
                    twitterUrl = url.replace("\\n", "");
                } else {
                    otherUrls.push(url.replace("\\n", ""));
                }
            });
            let websiteUrl = otherUrls[0] || false
            return {telegramUrl,twitterUrl,websiteUrl}
        }else{
            return {telegramUrl:false,twitterUrl:false,websiteUrl:false}
        }
    })
    .catch(error=>{
        return {telegramUrl:false,twitterUrl:false,websiteUrl:false}
    })
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
async function getTransactionReceipt(tx) {
    return await web3.eth.getTransactionReceipt(tx);
}
// Create an express app and server
const app = express();
const server = http.createServer(app);

// Start the server
const port = 3030;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

bot.setChatTitle(channelId1,"Hard Snipe Alert Bot 🎯")