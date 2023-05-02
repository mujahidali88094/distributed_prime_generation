var express = require('express');
const os = require('os');
const process = require('process');
const { Worker } = require('worker_threads');
const pidusage = require('pidusage');

let worker;
let primes = [];
let usageRecords = [];

// every minute, get the average cpu and memory usage
const intervalMs = 1000 * 60; // Sample interval in milliseconds
const interval = setInterval(() => {
  getAverageUsage(1).then((usageRecord) => {
    usageRecords.push(usageRecord);
    console.log(usageRecord, ' added');
  }).catch((error) => {
    console.error(error);
  });
}, intervalMs);

async function _generate(from, to) {
  return new Promise((resolve, reject) => {
    // Create a new worker thread to generate prime numbers
    
    worker = new Worker('./primeGenerator.js');
    // Send a message to the worker with the range of numbers
    worker.postMessage({ type: 'generate', from, to });

    // Listen for messages from the worker
    worker.on('message', (message) => {
      if (message.type === 'newPrime')
        primes.push(message.prime);
      else if (message.type === 'done')
        resolve(message);
    });

    // Listen for errors from the worker
    worker.on('error', (error) => {
      reject(error);
    });
  });
}

// Usage:
async function generate(from, to) {
  primes = [];
  usageRecords = [];
  try {
    // Generate prime numbers
    await _generate(from, to);
    console.log("done generating");
  } catch (error) {
    console.error('An error occurred', error);
  }
}

function get() {
  return primes;
}

function monitor(k) {
  // return usageRecords;
  if (usageRecords.length === 0) {
    return "no usage records";
  }
  else if (usageRecords.length < k) {
    return "not enough usage records";
  }
  let totalCpuUsage = 0;
  let totalMemoryUsage = 0;
  // add up the cpu and memory usage for the last k minutes
  for (let i = Math.max(usageRecords.length - k, 0); i < usageRecords.length; i++) {
    totalCpuUsage += usageRecords[i].avgCpuUsage;
    totalMemoryUsage += usageRecords[i].avgMemoryUsage;
  }
  // calculate the average cpu and memory usage
  const avgCpuUsage = totalCpuUsage / k;
  const avgMemoryUsage = totalMemoryUsage / k;
  return { k, AvgCPUUsage: avgCpuUsage.toFixed(2), AvgMemoryUsage: avgMemoryUsage.toFixed(2) };

  // const uptime = os.uptime();
  // const cpuUsage = process.cpuUsage();
  // const totalMemory = os.totalmem();
  // const freeMemory = os.freemem();
  // const memoryUsage = (totalMemory - freeMemory) / totalMemory * 100;
  // const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / (uptime * 1000) * 100;
  // const startTime = new Date(Date.now() - k * 60 * 1000);
  // console.log(`CPU usage for last ${k} minutes: ${cpuUsagePercent.toFixed(2)}%`);
  // console.log(`Memory usage for last ${k} minutes: ${memoryUsage.toFixed(2)}%`);
}


// create an express app
var app = express();

// declare routes
app.get('/', function (req, res) {
  res.send('Hello World!');
});
app.get('/generate', async function (req, res) {
  const from = parseInt(req.query.from);
  const to = parseInt(req.query.to);
  if (isNaN(from) || isNaN(to)) {
    res.status(400).send('Invalid parameters');
    return;
  }
  generate(from, to);
  res.send('Started Generating');
});

app.get('/get', async function (req, res) {
  res.json(get());
});

app.get('/monitor', function (req, res) {
  const k = parseInt(req.query.k);
  if (isNaN(k)) {
    res.status(400).send('Invalid parameters');
    return;
  }
  res.json(monitor(k));
});


// start the server
app.listen(3000, function () {
  console.log('App listening on port 3000!');
});

// get CPU and Memory usage of last k number of minutes
function getAverageUsage(k) {
  const pid = process.pid;
  const intervalMs = 1000; // Sample interval in milliseconds
  const startTime = Date.now() - k * 60 * 1000; // Calculate start time k minutes ago

  let totalCpuUsage = 0;
  let totalMemoryUsage = 0;
  let sampleCount = 0;

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      pidusage(pid, (err, stats) => {
        if (err) {
          clearInterval(interval);
          reject(err);
          return;
        }
        // console.log(stats);

        // Check if the sample is within the desired time range
        if (stats.timestamp >= startTime) {
          totalCpuUsage += stats.cpu / os.cpus().length;
          totalMemoryUsage += (stats.memory / 1024 / 1024);
          sampleCount++;
        }
      });
    }, intervalMs);

    setTimeout(() => {
      clearInterval(interval);

      if (sampleCount > 0) {
        const avgCpuUsage = totalCpuUsage / sampleCount;
        const avgMemoryUsage = totalMemoryUsage / sampleCount;
        resolve({ avgCpuUsage, avgMemoryUsage, pid });
      } else {
        reject(new Error(`No samples found within the last ${k} minutes`));
      }
    }, k * 60 * 1000); // Stop sampling after k minutes
  });
}

