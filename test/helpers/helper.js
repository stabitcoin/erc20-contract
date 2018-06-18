const fs = require('fs');
const parameters = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));

const BigNumber = web3.BigNumber;

function stabit(n) {
    return new web3.BigNumber(n *(10 ** parameters.decimals));
}

export const TotalSupply = stabit(parameters.totalSupply);