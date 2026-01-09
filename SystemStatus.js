const fs             = require("fs");
const path           = require("path");

class SystemStatus
{
    static #template = fs.readFileSync(path.join(__dirname, "status.html"), "utf8");

    static handle(ctx, next)
    {
        // Changed path to /status for a more generic feel
        if (ctx.path === "/status" || ctx.path === "/debuginfo")
        {
            ctx.type = "text/html";
            ctx.body = SystemStatus.#render();
            return;
        }

        return next();
    }

    static #render()
    {
        const usage  = process.memoryUsage();
        const uptime = process.uptime();
        let html     = SystemStatus.#template;

        // Optimistic Replacements
        html = html.replace("{{timestamp}}", new Date().toLocaleString());
        html = html.replace("{{uptime}}",    SystemStatus.#formatUptime(uptime));
        html = html.replace("{{node}}",      process.version);
        html = html.replace("{{platform}}",  process.platform);
        html = html.replace("{{rss}}",       SystemStatus.#toMB(usage.rss));
        html = html.replace("{{heapUsed}}",  SystemStatus.#toMB(usage.heapUsed));

        return html;
    }

    static #formatUptime(seconds)
    {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    }

    static #toMB(bytes)
    {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }
}

module.exports = SystemStatus;
