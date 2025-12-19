// @ts-nocheck
// HelloWorldKoa.js - example of HelloWorld for Koa
// 2025-11-14 ALK
// v 1.3 2025-12-11 ALK Renamed to EvilTrackerKoa.js
const Koa = require("koa");

// Class for a koa web server.
class KoaServer
{
  app     = new Koa();
  port    = 8080;
  server  = null;
  // Starting Koa http server
  startServer()
  {
    this.server = this.app.listen(this.port);
    console.log("Server started:");
    console.log("http://127.0.0.1:"+this.port+"/");

    process.once("SIGINT", this.shutdownServer.bind(this));
    console.log("(Press Ctrl-C to exit)");
  }
  // Shuts down server gracefully.
  shutdownServer()
  {
    // Legacy - node.js dont support await here, must use callback-function.
    this.server.close(KoaServer.#onServerClose);
  }
  // Inform and exit program.
  static #onServerClose()
  {
    console.log("Stopped server at http://127.0.0.1:"+this.port+"/");
    process.exit(0);
  }

  // Add middleware to a linked list of functions to call on requests
  // Priority: First added - last called.
  addMiddleware(middleware) {
    this.app.use(middleware);
  }
}

// Utility class for managing cookies.
class CookieManager
{
  // Sets a cookie using the Koa context.
  static setCookie(ctx, name, value)
  {
    // The maxAge is set to 30 days for this tracker cookie
    ctx.cookies.set(name, value, { httpOnly: true, maxAge: 2592000000 });
    console.log(`Cookie '${name}' set to '${value}'`);
  }

  // Reads a cookie value using the Koa context.
  static async readCookie(ctx, name)
  {
    return await ctx.cookies.get(name);
  }
}

// Application logic. Middleware function that greets user and tracks first visit.
async function helloWorld(ctx, next)
{
  const trackerName = "evilTracker";
  let firstVisit    = await CookieManager.readCookie(ctx, trackerName);
  let responseBody  = "Hello!";

  if (!firstVisit)
  {
    // Cookie not found, set it to the current date and time (ISO format)
    firstVisit = new Date().toISOString();
    CookieManager.setCookie(ctx, trackerName, firstVisit);
    responseBody = `Hello! Welcome to the world of Koa! This is your first visit, tracked from: ${firstVisit}`;
  }
  else
  {
    // Cookie found, report the time of the first visit
    responseBody = `Hello! Welcome back to the world of Koa! You first visited this site on: ${firstVisit}`;
  }

  ctx.body = responseBody;

  await next();
  console.log("I just greeted another visitor! First visit: "+firstVisit)
}

// Creates server, add middleware, starts server
const serverInstance = new KoaServer();
// Note: cookieHandler middleware from v1.2 is no longer needed as logic is moved to helloWorld
serverInstance.addMiddleware(helloWorld);
serverInstance.startServer();