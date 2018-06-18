const fs = require('fs');

const STABIT = artifacts.require("./StabitCoin.sol");
const config = JSON.parse(fs.readFileSync('../config/config.json', 'utf8'));

function stabit(n) {
    return new web3.BigNumber(n *(10 ** config.decimals));
}

module.exports = function (deployer) {

    const _totalSupply = stabit(config.totalSupply);
    deployer.deploy(STABIT, _totalSupply);
};