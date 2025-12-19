// UserDB.js
const mysql         = require('mysql2/promise');
// Import the PasswordHider utility class
const PasswordHider = require('./PasswordHider');

// Database layer class handling user persistence and retrieval using the MySQL pool.
class UserDB
{
    // Konstruktorn behöver inga argument längre
    constructor()
    {
        this.pool         = null;

        // Bind methods to ensure 'this' is correct when passed as external functions.
        this.validateUser = this.validateUser.bind(this);
        this.createUser   = this.createUser.bind(this);
        this.init         = this.init.bind(this);
        
        console.log('UserDB Singleton instans skapad.');
    }

    // Initializes the database connection pool and ensures the users table exists.
    async init(dbConfig)
    {
        if (this.pool) {
            console.log('Databaspoolen är redan initierad. Ignorerar init-anrop.');
            return;
        }

        this.pool = mysql.createPool(dbConfig);
        console.log('Database pool created.');

        // Create the user table if it does not exist
        const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL
)
        `;
        // Execute the query to create the table
        await this.pool.execute(createTableQuery);
        console.log('Table "users" verified.');
    }

    // Method to create a new user in the database.
    async createUser(username, password)
    {
        if (!this.pool)
        {
            throw new Error('Database connection not initialized. Call init() first.');
        }

        // Use the static hide method directly on the class
        const hashedPassword = await PasswordHider.hide(password);
        const query          = `
INSERT INTO users (username, password) 
VALUES      (?, ?)
        `;
        
        try
        {
            // Execute the INSERT query
            const [ result ] = await this.pool.execute(query, [username, hashedPassword]);
            return result.insertId;
        }
        catch (error)
        {
            // Check for duplicate entry error
            if (error.code === 'ER_DUP_ENTRY')
            {
                console.error(`User ${username} already exists.`);
                return null;
            }
            throw error;
        }
    }

    // Method to validate a user against the database.
    // This method is passed to the AuthenticationManager (username, password -> boolean).
    async validateUser(username, password)
    {
        if (!this.pool)
        {
            throw new Error('Database connection not initialized. Call init() first.');
        }

        // Query to retrieve the stored hash for the given username
        const query = `
SELECT password 
FROM   users 
WHERE  username = ?
        `;

        const [ rows ] = await this.pool.execute(query, [username]);

        // If no user is found, validation fails
        if (rows.length === 0)
        {
            return false;
        }

        const storedHash = rows[0].password;
        // Use the static verify method directly on the class
        const isValid    = await PasswordHider.verify(password, storedHash);

        return isValid;
    }
}

// Skapar den enda instansen av UserDB och exporterar den.
module.exports = new UserDB();