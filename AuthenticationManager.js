const crypto = require('crypto');

// Handles autentication of users with cookies. 
// Uses external validation of user/password. 
class AuthenticationManager
{
    constructor(validateUser)
    {
        this.validate   = validateUser; 
        this.cookieName = 'user';
        this.cookieTime = 60 * 60 * 1000; // 1 hour (ms)
        this.handleLogin= this.handleLogin.bind(this);
        this.authorize  = this.authorize.bind(this);
        
        // Remember all logged in users
        this.sessionStore = new Map();
    }

    async handleLogin(ctx, next)
    {
        const { username, password } = ctx.request.body || {};

        if (!username || !password)
        {
            ctx.throw(400, 'Användarnamn och lösenord krävs');
        }

        const isValid = await this.validate(username, password);

        if (isValid)
        {
            // Unique session-token for a user
            const token = crypto.randomUUID();

            // Remember which user we have. 
            this.sessionStore.set(token, username);
            
            const cookieConfig =
            {
                httpOnly: true,
                signed:   true,
                maxAge:   this.cookieTime
            };

            ctx.cookies.set(this.cookieName, token, cookieConfig);
            ctx.status = 200;
            ctx.body   = 'Inloggning lyckad';
        }
        else
        {
            ctx.status = 401;
            ctx.body   = 'Ogiltiga uppgifter';
        }
    }

    async authorize(ctx, next)
    {
        const cookieOptions = { signed: true };
        // Kolla om valid sessiontoken korrekt identifierar användare
        const token = ctx.cookies.get(this.cookieName, cookieOptions);
        const user  = this.sessionStore.get(token);
        
        if (token && user)
        {
            // Giltig inloggning - visa sidan för användaren. 
            ctx.state.user = user;
            await next();
        }
        else
        {
            ctx.status = 401;
            ctx.body   = 'Åtkomst nekad. Giltig session krävs.';
        }
    }
}

module.exports = AuthenticationManager;