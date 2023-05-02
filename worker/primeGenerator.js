const { parentPort, workerData } = require('worker_threads');

function isPrime(num) {
  if (num <= 1) {
    return false;
  }
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      return false;
    }
  }
  return true;
}

parentPort.on('message', (message) => {
  let {type, from, to} = message;
  if (type === 'generate') {
    console.log("generate primes from ", from, " to ", to);

    // Generate prime numbers
    for (let i = from; i <= to; i++) {
      if (isPrime(i)) {
        parentPort.postMessage({ type: 'newPrime', prime: i });
      }
    }
    parentPort.postMessage({ type: 'done' });
    // clearInterval(interval);
  }
});