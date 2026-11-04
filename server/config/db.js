const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodconnect';

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'bloodconnect',
      serverSelectionTimeoutMS: 15000,
    });

    isConnected = true;
    console.log(`\n=================================================`);
    console.log(`MongoDB Atlas: Connected`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Cluster: Cluster0`);
    console.log(`Storage Mode: Persistent MongoDB`);
    console.log(`=================================================\n`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error(`\n=================================================`);
    console.error(`❌ MongoDB Atlas: Connection Failed`);
    console.error(`Error: ${error.message}`);
    console.error(`Storage Mode: Fallback In-Memory Mode (Warning: Data will not persist)`);
    console.error(`=================================================\n`);
    return false;
  }
};

const getDbStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'Disconnected',
    1: 'Connected (MongoDB Atlas / Database)',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  return {
    stateCode: state,
    statusText: states[state] || 'Unknown',
    isConnected: state === 1,
    isAtlasConfigured: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv')),
    databaseName: mongoose.connection.name || 'bloodconnect',
    storageMode: state === 1 ? 'Persistent MongoDB' : 'In-Memory Fallback'
  };
};

module.exports = { connectDB, getDbStatus };
