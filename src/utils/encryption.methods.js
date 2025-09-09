const crypto = require('crypto');

const Encryption = {

    algorithm: 'aes-256-cbc',
    password: 'ekr!85545edr',

    async encrypt(secret) {
        const key = crypto.scryptSync(this.password, 'salt', 32);
        const iv = Buffer.alloc(16, 0);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        cipher.update(secret, 'utf8', 'base64');
        return cipher.final('base64');
    },

    async decrypt(encrypted) {
        const key = crypto.scryptSync(this.password, 'salt', 32);
        const iv = Buffer.alloc(16, 0);
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.update(encrypted, 'base64', 'utf8');
        return decipher.final('utf8');
    }
}

module.exports = Encryption;