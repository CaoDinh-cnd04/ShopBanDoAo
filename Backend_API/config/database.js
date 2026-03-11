const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SportsEcommerce',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: process.env.DB_OPTIONS_TRUST_SERVER_CERTIFICATE === 'true' || true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

const getPool = async () => {
    if (!pool) {
        try {
            pool = await sql.connect(config);
            console.log('✅ Connected to SQL Server database');
        } catch (err) {
            console.error('❌ Database connection error:', err);
            throw err;
        }
    }
    return pool;
};

const closePool = async () => {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('Database connection closed');
    }
};

// Helper function to execute queries with transaction support
const executeQuery = async (query, params = {}, transaction = null) => {
    try {
        const pool = await getPool();
        const request = transaction ? transaction.request() : pool.request();
        
        // Add parameters to request
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Query execution error:', err);
        throw err;
    }
};

// Helper function to execute stored procedures
const executeProcedure = async (procedureName, params = {}, transaction = null) => {
    try {
        const pool = await getPool();
        const request = transaction ? transaction.request() : pool.request();
        
        // Add parameters to request
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.execute(procedureName);
        return result.recordset;
    } catch (err) {
        console.error('Procedure execution error:', err);
        throw err;
    }
};

// Transaction helper
const executeTransaction = async (callback) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    sql,
    getPool,
    closePool,
    executeQuery,
    executeProcedure,
    executeTransaction,
    config
};
