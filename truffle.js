var HDWalletProvider = require("truffle-hdwallet-provider");
require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    testrpc: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777
    }
  }
};
