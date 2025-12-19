// @ts-nocheck
// HelloWorldKoa.js - example of HelloWorld for Koa
// 2025-11-14 ALK
// v 1.1 2025-12-03 ALK
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
    console.log("http://127.0.0.1:${this.port}/");

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
    console.log("Stopped server at http://127.0.0.1:8080/");
    process.exit(0);
  }

  // Add middleware to a linked list of functions to call on requests
  // Priority: First added - last called.
  addMiddleware(middleware) {
    this.app.use(middleware);
  }
}

// Class to manage setting and getting cookies.
class CookieManager
{
  // Sets a cookie with the specified name and value.
  static async setCookie(ctx, next)
  {
    const cookieName  = "user_id";
    const cookieValue = "123456789";

    ctx.cookies.set(cookieName, cookieValue, { httpOnly: true, maxAge: 86400000 }); // Expires after 24 hours
    console.log(`Cookie '${cookieName}' set to '${cookieValue}'`);

    await next();
  }

  // Reads and logs the value of a specific cookie.
  static async readCookie(ctx, next)
  {
    const cookieName  = "user_id";
    const cookieValue = await ctx.cookies.get(cookieName);

    if (cookieValue)
    {
      console.log(`Read cookie '${cookieName}' with value '${cookieValue}'`);
    }
    else
    {
      console.log(`Cookie '${cookieName}' not found`);
    }

    await next();
  }
}

// Application logic. Middleware function that greets user.
async function helloWorld(ctx, next)
{
  ctx.body = "Hello! Welcome to the world of Koa!";
  await next();
  console.log("I just greeted another visitor!")
}

// Creates server, add middleware, starts server
const serverInstance = new KoaServer();
serverInstance.addMiddleware(CookieManager.setCookie);
serverInstance.addMiddleware(CookieManager.readCookie);
serverInstance.addMiddleware(helloWorld);
serverInstance.startServer();