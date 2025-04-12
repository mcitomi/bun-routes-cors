# bun-routes-cors

<img src="https://i.imgur.com/ixmnz4M.png" alt="drawing" width="60" style="float: right;"/>

### CORS for the built-in routing (Bun.serve()):

A CORS module for the built-in router, which released in Bun version 1.2.3!

## 🚀 Installation
```
bun i bun-routes-cors
```
⚠️ Do not use "npm i"

## 🧪 Code example:

```js
import CORS from "bun-routes-cors";

Bun.serve({
    port: 8080,
    development: true,
    routes : CORS({
        "/register": {
            POST: async (req: Bun.BunRequest<"/register">) => {
               // your code here...
            }
        },
        "/login": {
            POST: async (req: Bun.BunRequest) => {
                // your code here...
            }
        },
        "/test/:link" : {
            GET: async (req) => {
                return Response.json({});
            },
            POST: async (req: Bun.BunRequest<"/test/:link">) => {
                return new Response(`Hi! Your link parameter: ${req.params.link}`); 
                // to use req params pass type to "req" like this
            }
        }
    }, {    // optional: set your custom headers, these are the default values:
        origin: "*",  // 'yoursite.com'
        methods: "*", // 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'
        headers: "*" // 'Content-Type', 'Authorization'
    })
});
```
Passing the second object is optional; if you don't specify the origin, methods, and headers values, everything is passed by default.

### 🪶 Preflight

It also handles "preflight" requests, returning CORS headers you specify or implicitly, a null response value, and a 204 status.
```js
new Response(null, {
    status: 204,
    headers: ...,
});
```

🍞 Official Docs: https://bun.sh/docs/api/http#bun-serve

Supports all request types described in the docs!