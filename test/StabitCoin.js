"use strict";

import { TotalSupply } from './helpers/helper';
import { EVMThrow } from './helpers/EVMThrow';

const expect = require('chai').expect;
const StabitCoin = artifacts.require('StabitCoin');
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('StabitCoin', function ([_, owner, investor, recipient, purchaser]) {
    let token;

    beforeEach(async function () {
        token = await StabitCoin.new(TotalSupply, { from: owner });
    });

    describe('Base erc20 config', function () {

        it('Check Token name', async function () {
            const expect = 'StabitCoin';
            const actual = await token.name();
            actual.should.be.equal(expect);
        });

        it('Check Symbol', async function () {
            const expect = 'STABIT';
            const actual = await token.symbol();
            actual.should.be.equal(expect);
        });

        it('Check decimals', async function () {
            const expect = 3;
            const actual = await token.decimals();
            actual.toNumber().should.be.bignumber.equal(expect);
        });

        it('total supply', async function () {
            const expect = TotalSupply;
            const actual = await token.totalSupply();
            assert.equal(actual, 500000000000);
        });

        it('when the requested account has some tokens', async function () {
            const balance = await token.balanceOf(owner);

            assert.equal(balance, 500000000000);
        })
    });

    describe('burn', function () {
        const from = owner;

        describe('when the given amount is not greater than balance of the sender', function () {
            const amount = 100;

            it('burns the requested amount', async function () {
                await token.burn(amount, { from });

                const balance = await token.balanceOf(from);
                assert.equal(balance, TotalSupply - 100);
            });

            it('emits a burn event', async function () {
                const { logs } = await token.burn(amount, { from });
                const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
                assert.equal(logs[0].event, 'Burn');
                assert.equal(logs[0].args.burner, owner);
                assert.equal(logs[0].args.value, amount);
            });

            it('when the given amount is greater than the balance of the sender', async function () {
                const amount = TotalSupply + 1;
                await token.burn(amount, { from }).should.be.rejectedWith(EVMThrow);
            });
        });
    });

    describe('pause', function () {
        describe('when the sender is the token owner', function () {
            const from = owner;

            describe('when the token is unpaused', function () {
                it('pauses the token', async function () {
                    await token.pause({ from });

                    const paused = await token.paused();
                    assert.equal(paused, true);
                });

                it('emits a paused event', async function () {
                    const { logs } = await token.pause({ from });

                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Pause');
                });
            });

            describe('when the token is paused', function () {
                beforeEach(async function () {
                    await token.pause({ from });
                });

                it('reverts', async function () {
                    await token.pause({ from }).should.be.rejectedWith(EVMThrow);
                });
            });
        });

        describe('when the sender is not the token owner', function () {
            const from = purchaser;

            it('reverts', async function () {
                await token.pause({ from }).should.be.rejectedWith(EVMThrow);
            });
        });
    });

    describe('unpause', function () {
        describe('when the sender is the token owner', function () {
            const from = owner;

            describe('when the token is paused', function () {
                beforeEach(async function () {
                    await token.pause({ from });
                });

                it('unpauses the token', async function () {
                    await token.unpause({ from });

                    const paused = await token.paused();
                    assert.equal(paused, false);
                });

                it('emits an unpaused event', async function () {
                    const { logs } = await token.unpause({ from });

                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Unpause');
                });
            });

            describe('when the token is unpaused', function () {
                it('reverts', async function () {
                    await token.unpause({ from }).should.be.rejectedWith(EVMThrow);
                });
            });
        });

        describe('when the sender is not the token owner', function () {
            const from = purchaser;

            it('reverts', async function () {
                await token.unpause({ from }).should.be.rejectedWith(EVMThrow);
            });
        });
    });

    // pauseable
    describe('pausable token', function () {
        const from = owner;

        describe('paused', function () {
            it('is not paused by default', async function () {
                const paused = await token.paused({ from });

                assert.equal(paused, false);
            });

            it('is paused after being paused', async function () {
                await token.pause({ from });
                const paused = await token.paused({ from });

                assert.equal(paused, true);
            });

            it('is not paused after being paused and then unpaused', async function () {
                await token.pause({ from });
                await token.unpause({ from });
                const paused = await token.paused();

                assert.equal(paused, false);
            });
        });

        describe('transfer', function () {
            it('allows to transfer when unpaused', async function () {
                await token.transfer(recipient, 100, { from: owner });

                const senderBalance = await token.balanceOf(owner);
                assert.equal(senderBalance, TotalSupply - 100);

                const recipientBalance = await token.balanceOf(recipient);
                assert.equal(recipientBalance, 100);
            });

            it('allows to transfer when paused and then unpaused', async function () {
                await token.pause({ from: owner });
                await token.unpause({ from: owner });

                await token.transfer(recipient, 100, { from: owner });

                const senderBalance = await token.balanceOf(owner);
                assert.equal(senderBalance, TotalSupply - 100);

                const recipientBalance = await token.balanceOf(recipient);
                assert.equal(recipientBalance, 100);
            });

            it('reverts when trying to transfer when paused', async function () {
                await token.pause({ from: owner });

                await token.transfer(recipient, 100, { from: owner }).should.be.rejectedWith(EVMThrow);
            });
        });

        describe('approve', function () {
            it('allows to approve when unpaused', async function () {
                await token.approve(purchaser, 40, { from: owner });

                const allowance = await token.allowance(owner, purchaser);
                assert.equal(allowance, 40);
            });

            it('allows to transfer when paused and then unpaused', async function () {
                await token.pause({ from: owner });
                await token.unpause({ from: owner });

                await token.approve(purchaser, 40, { from: owner });

                const allowance = await token.allowance(owner, purchaser);
                assert.equal(allowance, 40);
            });

            it('reverts when trying to transfer when paused', async function () {
                await token.pause({ from: owner });

                await token.approve(purchaser, 40, { from: owner }).should.be.rejectedWith(EVMThrow);
            });
        });

        describe('transfer from', function () {
            beforeEach(async function () {
                await token.approve(purchaser, 50, { from: owner });
            });

            it('allows to transfer from when unpaused', async function () {
                await token.transferFrom(owner, recipient, 40, { from: purchaser });

                const senderBalance = await token.balanceOf(owner);
                assert.equal(senderBalance, TotalSupply - 40);

                const recipientBalance = await token.balanceOf(recipient);
                assert.equal(recipientBalance, 40);
            });

            it('allows to transfer when paused and then unpaused', async function () {
                await token.pause({ from: owner });
                await token.unpause({ from: owner });

                await token.transferFrom(owner, recipient, 40, { from: purchaser });

                const senderBalance = await token.balanceOf(owner);
                assert.equal(senderBalance, TotalSupply - 40);

                const recipientBalance = await token.balanceOf(recipient);
                assert.equal(recipientBalance, 40);
            });

            it('reverts when trying to transfer from when paused', async function () {
                await token.pause({ from: owner });
                await token.transferFrom(owner, recipient, 40, { from: purchaser }).should.be.rejectedWith(EVMThrow);
            });
        });

        describe('decrease approval', function () {
            beforeEach(async function () {
                await token.approve(purchaser, 100, { from: owner });
            });

            it('allows to decrease approval when unpaused', async function () {
                await token.decreaseApproval(purchaser, 40, { from: owner });

                const allowance = await token.allowance(owner, purchaser);
                assert.equal(allowance, 60);
            });

            it('allows to decrease approval when paused and then unpaused', async function () {
                await token.pause({ from: owner });
                await token.unpause({ from: owner });

                await token.decreaseApproval(purchaser, 40, { from: owner });

                const allowance = await token.allowance(owner, purchaser);
                assert.equal(allowance, 60);
            });

            it('reverts when trying to transfer when paused', async function () {
                await token.pause({ from: owner });
                await token.decreaseApproval(purchaser, 40, { from: owner }).should.be.rejectedWith(EVMThrow);
            });
        });

        describe('increase approval', function () {
            beforeEach(async function () {
                await token.approve(purchaser, 100, { from: owner });
            });

            it('allows to increase approval when unpaused', async function () {
                await token.increaseApproval(purchaser, 40, { from: owner });

                const allowance = await token.allowance(owner, purchaser);
                assert.equal(allowance, 140);
            });

            it('allows to increase approval when paused and then unpaused', async function () {
                await token.pause({ from: owner });
                await token.unpause({ from: owner });

                await token.increaseApproval(purchaser, 40, { from: owner });

                const allowance = await token.allowance(owner, purchaser);
                assert.equal(allowance, 140);
            });

            it('reverts when trying to increase approval when paused', async function () {
                await token.pause({ from: owner });
                await token.increaseApproval(purchaser, 40, { from: owner }).should.be.rejectedWith(EVMThrow);
            });
        });
    });

    describe('chain migration', function () {

        it('reverts migration', async function () {
            await token.migrationChain(1000, { from: owner }).should.be.rejectedWith(EVMThrow);
        });

        it('reverts startMigration if not owner', async function () {
            await token.startMigration({ from: investor }).should.be.rejectedWith(EVMThrow);
        })

        it('reverts stopMigration if not owner', async function () {
            await token.stopMigration({ from: investor }).should.be.rejectedWith(EVMThrow);
        })

        it('default migrationPeriod is false', async function() {
            const boolPeriod = await token.migrationPeriod();
            assert.equal(boolPeriod , false);
        });

        it('accept startMigration', async function () {
            await token.startMigration({ from: owner });
            assert.equal(await token.migrationPeriod(), true);
        })

        it('accept stopMigration', async function () {
            await token.startMigration({ from: owner });
            await token.stopMigration({ from: owner });
            assert.equal(await token.migrationPeriod(), false);
        });

        it('when the requested account has some migrations', async function () {
            await token.startMigration({ from: owner });
            await token.migrationChain(1000, { from: owner });
            const migrationToken = await token.showMigrationAmount(owner);

            assert.equal(migrationToken, 1000);
        });

        it('set migrationAddress', async function () {
            const statbitAddress = "aaaaAAAAA1111222";
            await token.startMigration({ from: owner });
            await token.setMigrationStabitcoinAddress(statbitAddress, { from: owner });
            const returnAddress = await token.showMigrationStabitcoinAddress(owner)
            assert.equal(statbitAddress, returnAddress);
        });

        it('change migrationAddress', async function () {
            const statbitAddress = "aaaaAAAAA1111222";
            const changeStatbitAddress = "2222AAAAA1111222";
            await token.startMigration({ from: owner });
            await token.setMigrationStabitcoinAddress(statbitAddress, { from: owner });
            await token.setMigrationStabitcoinAddress(changeStatbitAddress, { from: owner });
            const returnAddress = await token.showMigrationStabitcoinAddress(owner)
            assert.equal(changeStatbitAddress, returnAddress);
        });

        it('none migrationAddress', async function () {
            const noneWords = "";
            await token.startMigration({ from: owner });
            await token.setMigrationStabitcoinAddress(noneWords, { from: owner });
            const returnAddress = await token.showMigrationStabitcoinAddress(owner)
            assert.equal(noneWords, returnAddress);
        });

        it('accept over 100 words ', async function () {
            const stringWords = "aaaaaAAAAA1111122222aaaaaAAAAA1111122222aaaaaAAAAA1111122222aaaaaAAAAA1111122222aaaaaAAAAA1111122222";
            await token.startMigration({ from: owner });
            await token.setMigrationStabitcoinAddress(stringWords, { from: owner });
            const resultWords = await token.showMigrationStabitcoinAddress(owner);
            assert.equal(resultWords, stringWords);
        });


    });
});