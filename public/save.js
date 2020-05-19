exports.saveBalances = function(lastBalance, exchangesArray, callback) {
  
  const lastDate = lastBalance.date && new Date(lastBalance.date).getTime() || 0;
  const currentDate = new Date().getTime();
  const buffer = 14100000; // 3h 55min instead of 4h because heroku scheduler is unaccurate

  // if it has been 4 hr since the last log
  if (currentDate - lastDate > buffer) {

    // get balances of exchanges

  } else {
    callback({save: false}, undefined);
  }

}