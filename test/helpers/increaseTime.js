import latestTime from './latestTime';

// Increases ganache time by the passed duration in seconds
export default function increaseTime(duration, target) {
  const id = Date.now();
  web3.currentProvider.sendAsync({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [duration],
    id: id,
  }, err1 => {
    if (err1) return reject(err1);

    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      params: [duration],
      id: id + 1,
    }, (err2, res) => {
      return err2 ? reject(err2) : resolve(res);
    });
  });
}

export function decreaseTime() {
  const id = Math.floor(Date.now()/1000);
  let now = latestTime();
  let diff = now - id;
  if (now <= id) {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: id + 1,
    }, (err2, res) => {
      return err2 ? reject(err2) : resolve(res);
    });
  } else {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_decreaseTime',
      params: [diff],
      id: id,
    }, err1 => {
      if (err1) return reject(err1);

      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id + 1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res);
      });
    });
  }
}

/**
 * Beware that due to the need of calling two separate ganache methods and rpc calls overhead
 * it's hard to increase time precisely to a target point so design your test to tolerate
 * small fluctuations from time to time.
 *
 * @param target time in seconds
 */
export function increaseTimeTo(target) {
  let now = latestTime();
  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  let diff = target - now;
  return increaseTime(diff, target);
}

export const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};