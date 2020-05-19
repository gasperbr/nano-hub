const axios = require('axios').default;
const Exchange = require('./exchange.js');
const Withdraw = require('./withdraw.js');

// NANO withdrawal fee
const getWithdrawalFee = function(exchange) {
  if (exchange === 'Binance') {
    return 0.01;
  }
  return 1;
}

// callback will save strategy object to database
exports.rebuy = function(strategy, callback) {

  if (strategy && strategy.status === 'up' && strategy.address && strategy.nanoLimit >= 1) {
    
    axios(`https://${'murmuring-gorge-42529' || process.env.APPNAME}.herokuapp.com/api/nano-balance/${strategy.address}`).then(res => {
      
      // parse balance from response
      let balance;
      if (res.data && res.data.account && res.data.account.balance) {
        const stringBalance = res.data.account.balance || '0';
        const stringPending = res.data.account.pending || '0';
        balance = parseInt(stringBalance.substring(0, stringBalance.length - 20)) / (10 ** 10); // avoid overflow errors with calculations
        balance += (parseInt(stringPending.substring(0, stringPending.length - 20)) || 0) / (10 ** 10); // avoid overflow errors with calculations
      }
      
      console.log('NANO ', balance)
      // check if nano has to be bought
      if ((balance || balance === 0) && balance < strategy.nanoLimit) {

        // check if there has been 1 hour since the last repurchase, in not reject purchase
        // this is implemented in case the binance api withdrawal is slow and has not happened yet
        const previousExecution = new Date(strategy.history && strategy.history.lastExecution).getTime() || 0;
        const currentTime = new Date().getTime();
        const timeBufferMs = 3600000; // 1hr
        
        if (strategy.history && strategy.history.nanoBought > 0 && currentTime - previousExecution < timeBufferMs) {
          console.log('not enought time has passed');
          return callback(strategy);
        }

        console.log('checking if withdrawals enabled');
        // check if withdrawals are enabled (will reject if not)
        Withdraw.withdrawalsEnabled(strategy.exchange).then(() => {
          
          console.log('withdrawals enabled');

          // 0.01 NANO is Binance withdrawal fee
          const withdrawalFee = getWithdrawalFee(strategy.exchange);

          const diff = (withdrawalFee + strategy.nanoLimit) - balance;
          // will purchase 'diff' ammount of NANO or the min Binance trader order ammount
          Exchange.marketBuyOrder(strategy.exchange, strategy.pair, diff, function(error, purchasedAmount) {

            if (error) {
              
              callback({
                ...strategy,
                history: {nanoBought: 0, message: error, lastExecution: new Date()}
              });

            } else {
              
              console.log('bought NANO: ', purchasedAmount);
              console.log('withdrawNano');
              Withdraw.withdrawNano(purchasedAmount, strategy.address, function(error, httpResult, res) {
                
                const response = JSON.parse(res);
                console.log(response);

                if (error || !response.success) {
                  callback({
                    ...strategy,
                    history: {nanoBought: 0, message: response.message, lastExecution: new Date()}
                  });
                } else {
                  callback({
                    ...strategy,
                    history: {nanoBought: purchasedAmount, message: 'Successfully initiated withdrawal', lastExecution: new Date()}
                  });
                }
              });
            }
          });
        }).catch((message) => {
          console.log("NANO withdrawals disabled, don't execute strategy");
          if (strategy.history) {
            strategy.message = message;
          } else {
            strategy.history = {nanoBought: 0,message,lastExecution: new Date()}
          }
          callback(strategy);
        });
      } else {
        console.log('repurchase not required');
        callback(strategy);
      }
    }).catch(err => {
      console.log('failed to read balance');
      callback({
        ...strategy,
        history: {nanoBought: 0, message: err.message || err.msg || err, lastExecution: new Date()}
      });
    });
  } else {
    console.log('no set parameters');
    callback(strategy);
  }
}
/* rebuy({
  status: 'up',
  address: 'nano_1ciab3uzyzze4noaaf1b8jm584ifmkfwukter55nted3x3zxiz4cw7wxjgn5',
  nanoLimit: 3000,
  exchange: 'Binance',
  pair: 'NANOETH',
  history: {
    lastExecution: new Date().getTime() - 100000000,
  }
}, console.log); */

/* axios(`https://murmuring-gorge-42529.herokuapp.com/api/nano-balance/nano_1ciab3uzyzze4noaaf1b8jm584ifmkfwukter55nted3x3zxiz4cw7wxjgn5`).then(res => {
  console.log(res.data.account.balance.length);
}); */