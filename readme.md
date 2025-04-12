# bun-routes-cors

## Code example:

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
    })
});
```