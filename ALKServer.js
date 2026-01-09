// KoaServer.js
const Koa          = require("koa");

class ALKServer 
{   
    app            = new Koa();
    port           = 8080;
    server         = null;
    #authProvider    = "./DefaultAuth";
    static #instance = null;      
    #registry = [];
    
    constructor()
    { 
       // Singleton
      ALKServer.#instance = ALKServer.#instance|| this;
      return ALKServer.#instance;
    }

    /**
      * Global åtkomstpunkt till Kerneln.
      */
    static get instance()
    {
        return ALKServer.#instance;
    }

    /**
      * Returnerar en kopia av registret.
      */
    get stack()
    {
        return [...this.#registry];
    }
    
    static get #networkIP()
    {
      // Parses following type of data: 
      //  {
      //   "lo0":   [ { address: "127.0.0.1", ... } ],
      //    "eth0":  [ { address: "192.168.1.5", ... } ],
      //    "wlan0": [ { address: "10.0.0.12", ... } ]
      //  }
        const interfaces = os.networkInterfaces();
        const names      = Object.keys(interfaces);
    
        let ip        = "127.0.0.1";
        let nameIndex = 0;
    
        while (nameIndex < names.length)
        {
            const adapter = interfaces[names[nameIndex]];
            let netIndex  = 0;
    
            while (netIndex < adapter.length)
            {
                const net = adapter[netIndex];
    
                if (net.family === "IPv4" && !net.internal)
                {
                    ip        = net.address;
                    
                    // Stäng ner båda looparna
                    netIndex  = adapter.length;
                    nameIndex = names.length;
                }
    
                netIndex++;
            }
    
            nameIndex++;
        }
    
        return ip;
    }
    // Startup server
    startServer() 
    {
        // Can't start server if already started. 
        if (this.server)  { return; }
        
        this.server = this.app.listen(this.port);
        
        console.log("Server started:");
        console.log("http://127.0.0.1:"+this.port+"/");
        console.log("http://"+ALKServer.#networkIP+":"+this.port+"/");
        
        // Gracefully handle shutdown requests from user
        process.once("SIGINT", this.shutdownServer.bind(this));
        process.once("SIGTERM", this.shutdownServer.bind(this));
        console.log("(Press Ctrl-C to exit)");
    }

    shutdownServer() 
    {
        // Node.js demands callback for close (node.js - artefact)
        this.server.close(ALKServer.#onServerClose);
    }
    
    // Internal callback for when server has closed. 
    static #onServerClose() 
    {
        console.log("Stopped server at http://127.0.0.1:8080/");
        process.exit(0);
    }
    
    // Adds middleware to the server.
    // First added is first triggered (called).  
    addMiddleware(target)
    {
        try 
        {
            const module = require(`./${target}`);
            this.app.use(module.handle || module);
            
            console.log(`  [+] Registry: ${target}`);
        }
        catch (e) 
        {
            // Function ?
            if (typeof target === "function" || target?.handle)
            {
                this.app.use(target.handle || target);
                console.log(`  [+] Direct:   ${target.name || "anonymous"}`);
            }
            else 
            {
                // Om inget av ovanstående fungerar loggar vi felet
                console.error(`  [!] Unresolved middleware: ${target}`);
            }
        }
    }

    /**
      * Add authoritization handler
      */
    setAuthProvider(provider)
    {
        this.#authProvider = provider;
        console.log("[ALK]: Auth provider has been exchanged.");
    }
    
    // Standard handlers as defined by envirenment config file is added. 
    setupDefaults()
    {
        console.log("[ALK]: Loading Infrastructure...");

        this.addMiddleware(require("./ErrorContext").handle);

        // Vi skickar med namnet och sökvägen direkt till loggen
        this.#addOptionalLayer("ALK_ENABLE_STATUS", "./SystemStatus", "Status");
        this.#addOptionalLayer("ALK_ENABLE_AUTH",   this.#authProvider, "Identity");
        this.#addOptionalLayer("ALK_ENABLE_JSON",   "./JsonContext",   "Parser");

        console.log("[ALK]: Kernel Ready.\n");
    }

    #addOptionalLayer(envVar, target, displayName)
    {
        if (process.env[envVar] === "true")
        {
            try 
            {
                this.addMiddleware(require(target).handle);
                console.log(`  [+] ${displayName.padEnd(8)} @ ${target}`);
            }
            catch (error)
            {
                console.error(`  [!] Error loading ${displayName} (${target}): ${error.message}`);
            }
        }
    }
}

module.exports     = ALKServer;
