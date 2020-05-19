const CryptoJS = require("crypto-js");
const request = require('request');

exports.withdrawNano = function(nanoAmount, address, callback) { // callback recieves (error, response, body) parameters

  // binance allows withdrawals only for whitelisted IP's
  // use heroku plugin 'fxie' for fixed IP when sending requests
  const fixieRequest = request.defaults({'proxy': process.env.FIXIE_URL});
  const apiKey = process.env.BINANCE_API_KEY_WITHDRAW;
  const secretKey = process.env.BINANCE_SECRET_KEY_WITHDRAW;
  const timestamp = new Date().getTime();
  const headers = {'X-MBX-APIKEY': apiKey};

  const totalParams = `asset=NANO&address=${address}&amount=${nanoAmount}&timestamp=${timestamp}`;
  const signature = CryptoJS.HmacSHA256(totalParams, secretKey).toString();

  const api = 'https://www.binance.com/wapi/v3/withdraw.html';
  const url = `${api}?${totalParams}&signature=${signature}`;

  fixieRequest({url, headers, method: 'POST'}, callback);

}

exports.withdrawalsEnabled = function(exchange) {
  return new Promise((resolve, reject) => {

    if (exchange === 'Binance'){

      request('https://www.binance.com/assetWithdraw/getAllAsset.html', function(err, http, res) {
        if (err) {
          reject(`Couldn't  get status of ${exchange} withdrawal service`);
        } else {
          JSON.parse(res).forEach(asset => {
            if (asset.parentCode === 'NANO') {
              if (asset.enableWithdraw) {
                resolve(true);
              } else {
                reject('Withdrawals currently disabled');
              }
            }
          });
        }
      });
    }
  });
}

// withdrawalsEnabled('Binance').then(console.log);