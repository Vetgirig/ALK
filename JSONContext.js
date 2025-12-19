// JsonContext.js
class JsonContext
{
    static #instance   = new JsonContext();

    constructor()
    {
        const bodyParser   = require("koa-bodyparser");
        this.parser        = bodyParser();
    }

    static get handle()
    {
        return (ctx, next) => JsonContext.#instance.#parse(ctx, next);
    }

    async #parse(ctx, next)
    {
        // Denna kör nu bodyparser för ALLA inkommande anrop
        await this.parser(ctx, next);
    }
}

module.exports         = JsonContext;
