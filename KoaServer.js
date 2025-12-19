// KoaServer.js
const Koa          = require("koa");

class KoaServer 
{
    app            = new Koa();
    port           = 8080;
    server         = null;

    startServer() 
    {
        this.server = this.app.listen(this.port);
        
        console.log("Server started:");
        console.log(`http://127.0.0.1:${this.port}/`);
        
        process.once("SIGINT", this.shutdownServer.bind(this));
        console.log("(Press Ctrl-C to exit)");
    }

    shutdownServer() 
    {
        // Node.js kräver callback här för close
        this.server.close(KoaServer.#onServerClose);
    }

    static #onServerClose() 
    {
        console.log("Stopped server at http://127.0.0.1:8080/");
        process.exit(0);
    }

    addMiddleware(middleware) 
    {
        this.app.use(middleware);
    }
}

module.exports     = KoaServer;
