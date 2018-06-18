pragma solidity 0.4.18;

import "./token/StandardToken.sol";
import "./token/BurnableToken.sol";
import "./token/PausableToken.sol";
import "./token/DetailedERC20.sol";

contract StabitCoin is StandardToken, BurnableToken, PausableToken, DetailedERC20 {

    event Mint(address indexed to, uint256 amount);

    event MigrationSender(address indexed from , uint256 amount);

    event MigrationAddress(address indexed from , string stabitAddress);

    struct Migration {
        string stabitcoinAddress;
        uint256 amount;
    }

    bool public migrationPeriod = false;


    mapping (address => Migration) migrations;

    function StabitCoin(
        uint256 _totalSupply
    )
    public
    DetailedERC20("StabitCoin","STABIT",3)
    {
        totalSupply_ = totalSupply_.add(_totalSupply);
        balances[msg.sender] = balances[msg.sender].add(_totalSupply);
        Mint(msg.sender, _totalSupply);
        Transfer(address(0), msg.sender, _totalSupply);
    }

    modifier whenMigrationPeriod() {
        require(migrationPeriod == true);
        _;
    }

    function migrationChain(uint256 _value) whenMigrationPeriod public {
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply_ = totalSupply_.sub(_value);
        migrations[msg.sender].amount += _value;
        MigrationSender(msg.sender, _value);
        Burn(msg.sender, _value);
    }

    function showMigrationAmount(address _migrationAddress) public view returns (uint256) {
        return migrations[_migrationAddress].amount;
    }

    function setMigrationStabitcoinAddress(string _stabitcoinAddress) whenMigrationPeriod public {
        migrations[msg.sender].stabitcoinAddress = _stabitcoinAddress;
        MigrationAddress(msg.sender, _stabitcoinAddress);
    }

    function showMigrationStabitcoinAddress(address _walletAddress) public view returns (string) {
        return migrations[_walletAddress].stabitcoinAddress;
    }

    function startMigration() onlyOwner public {
        migrationPeriod = true;
    }

    function stopMigration() onlyOwner public {
        migrationPeriod = false;
    }
}