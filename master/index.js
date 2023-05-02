const axios = require("axios");
let fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

//utils
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function startGeneratingPrimes(from, to, host){
  let endpoint = host + '/generate?from=' + from + '&to=' + to;
  axios.get(endpoint).then((res) => {
    let data = res.data;
    console.log(data);
  }).catch((err) => {
    console.log(err);
  });
}
class SortedSet {
  constructor() {
    this.map = new Map();
  }
  add(value) {
    if (!this.map.has(value)) {
      this.map.set(value, this.map.size);
    }
  }
  delete(value) {
    if (this.map.has(value)) {
      this.map.delete(value);
    }
  }
  has(value) {
    return this.map.has(value);
  }
  values() {
    return [...this.map.keys()].sort();
  }
  size() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
}


let targetHosts = [
  'http://container0:3000',
  'http://container1:3000',
  'http://container2:3000',
];
const primes = new SortedSet();
const primesUpdateInterval = 1 * 60 * 1000;
const monitorUpdateInterval = 1 * 60 * 1000;

startGeneratingPrimes(0, 33_333_333_333, targetHosts[0]);
startGeneratingPrimes(33_333_333_333, 66_666_666_666, targetHosts[1]);
startGeneratingPrimes(66_666_666_666, 100_000_000_000, targetHosts[2]);

// truncate csv file
fs.truncate('data.csv', 0, function () { console.log('truncated csv file') });
// write header to csv file
const csvWriter = createCsvWriter({
  path: 'data.csv',
  header: [
    {id: 'time_stamp', title: 'time_stamp'},
    {id: 'cpu', title: 'cpu'},
    {id: 'memory', title: 'memory'}
  ]
});

const monitorJob = setInterval(() => {
  let endpoint =  getRandom(targetHosts) + '/monitor?k=1';
  axios.get(endpoint).then((res) => {
    const now = new Date();
    let data = {
      time_stamp: now.toLocaleString('en-US'),
      cpu: res.data.AvgCPUUsage,
      memory: res.data.AvgMemoryUsage
    }
    //write to csv file
    csvWriter.writeRecords([data]);
  }).catch((err) => {
    console.log(err);
  });
}, monitorUpdateInterval);

const primesJob = setInterval(() => {
  targetHosts.forEach((host) => {
    let endpoint = host + '/get';
    axios.get(endpoint).then((res) => {
      let data = res.data;
      data.forEach((prime) => {
        primes.add(prime);
      });
      console.log("total primes: ", primes.size());
    }).catch((err) => {
      console.log(err);
    });
  });
}, primesUpdateInterval);

function getPrimes() {
  return primes.values();
}