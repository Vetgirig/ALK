// PasswordHider.js
const bcrypt        = require('bcrypt');
const SALT_ROUNDS   = 10;

// Provides hiding of passwords through static methods. 
class PasswordHider
{
    constructor()
    {
        // Prevent instantiation
        throw new Error('PasswordHider cannot be instantiated.');
    }

    // Securely hashes the plaintext password to 'hide' it.
    static async hide(password)
    {
        const salt      = await bcrypt.genSalt(SALT_ROUNDS);
        const hashValue = await bcrypt.hash(password, salt);
        
        return hashValue;
    }

    // Verifies a plaintext password against a stored hash for validation.
    static async verify(password, storedHash)
    {
        const isMatch   = await bcrypt.compare(password, storedHash);
        return isMatch;
    }
}

module.exports = PasswordHider;