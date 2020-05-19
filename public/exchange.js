const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY_TRADE,
  APISECRET: process.env.BINANCE_SECRET_KEY_TRADE
});

const binancePairs = ['NANOUSDT', 'NANOBUSD', 'NANOBTC', 'NANOETH', 'NANOBNB'];
const binanceGeneralInfo = {};
binancePairs.forEach(pair => {
  binanceGeneralInfo[pair] = {
    minNotional: undefined, // min order size (e.g. in USDT)
    stepSize: undefined, // price decimals
    tickSize: undefined // nano decimals
  }
});

exports.pairInfo = function(exchange, pair) {
  return getPairInfo(exchange, pair);
}

// returns minimum order size and decimals for pair
const getPairInfo = function(exchange, pair) {
  return new Promise((resolve, reject) => {

    if (exchange === 'Binance') {
      
      if (binanceGeneralInfo[pair].minNotional) {
        resolve(binanceGeneralInfo[pair]);
      }

      binance.exchangeInfo().then(data => {
        for (let obj of data.symbols ) {
          if (binancePairs.includes(obj.symbol)) {
            let filters = {};
            for ( let filter of obj.filters ) {
              if ( filter.filterType == "MIN_NOTIONAL" ) {
                filters.minNotional = filter.minNotional;
              } else if ( filter.filterType == "PRICE_FILTER" ) {
                filters.tickSize = filter.tickSize;
              } else if ( filter.filterType == "LOT_SIZE" ) {
                filters.stepSize = filter.stepSize;
              }
            }
            binanceGeneralInfo[obj.symbol] = filters;
          }
        }
        resolve(binanceGeneralInfo[pair]);
      }).catch(reject);
    }
  });
}

// get recent prices
exports.bookTicker = function(exchange, pair) {
  return getOrderBook(exchange, pair);
}

getBookTicker = function(exchange, pair) {
  return new Promise((resolve, reject) => {
    
    if (exchange === 'Binance') {
      binance.bookTickers((error, tickers) => {
        if (error) reject(error);
        if (!error) resolve(tickers.find(ticker => ticker.symbol === pair));
      });
    }

  });
}

exports.limitOrder = function(exchange, pair, price, nanoQuantity, callback) {
}

exports.marketBuyOrder = function(exchange, pair, quantity, callback) {

  if (exchange === 'Binance') {
    
    Promise.all([  
      getPairInfo(exchange, pair),
      getBookTicker(exchange, pair)
    ]).then(([pairInfo, ticker]) => {

      const round = 10 ** (pairInfo.stepSize.indexOf('1') - 1);

      // set min order to 0.5% more to avoid rejection for smaller order size due to slippage
      const minNanoOrderSize = (parseFloat(pairInfo.minNotional) * 1.005) / parseFloat(ticker.askPrice); 
      
      const orderAmount = Math.ceil(Math.max(minNanoOrderSize, quantity) * round) / round;
      
      executeMarketBuy(exchange, pair, orderAmount, callback);
        
    }).catch(err => {
      callback(err, undefined);
    });

  }
}

const executeMarketBuy = function(exchange, pair, quantity, callback) {
  console.log(exchange, pair, quantity);
  if (exchange === 'Binance') {
    binance.marketBuy(pair, quantity).then(res => {
      callback(undefined, quantity);

      // catch will also be executed if callback() rejects

    }).catch((err) => {
      if (!err) {
        return;
      }

      let message;
      if (typeof err.body === 'string') {
        message = JSON.parse(err.body).msg;
      } else {
        message = err.body.msg;
      }
      callback('Failed to execute buy order: ' + message, undefined);
    });
  }
}
