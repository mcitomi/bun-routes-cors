// Bun Router CORS v0.2
// Supports all docs described response https://bun.sh/docs/api/http#bun-serve
// by: mcitomi ~ www.mcitomi.hu ~ dc.mcitomi.hu
// 💫📨🪶

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

const allowedMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

type RouteHandler<Path extends string> = (req: Bun.BunRequest<Path>) => Response | Promise<Response>;

type Route<Path extends string> =
    | RouteHandler<Path>
    | { [M in HTTPMethod]?: RouteHandler<Path> }
    | Response;

type Routes = {
    [Path in string]:
    | Route<Path>
    | RouteHandler<Path>
    | Response
};

interface CorsOptions {
    origin?: string;
    methods?: string;
    headers?: string;
}

/**
 * Wraps route handlers to automatically include CORS headers in all responses.
 * 
 * Supports route definitions with direct handler functions, method-specific objects, or predefined `Response` objects.
 * Automatically injects `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` headers.
 * 
 * If an OPTIONS preflight route is not defined for a path, it will be generated automatically with a 204 No Content response.
 * 
 * @function
 * @param {Routes} routes - An object containing route paths as keys and route handlers or response objects as values.
 * @param {CorsOptions} [options] - Optional CORS configuration.
 * @param {string} [options.origin="*"] - The value for the `Access-Control-Allow-Origin` header.
 * @param {string} [options.methods="*"] - The value for the `Access-Control-Allow-Methods` header.
 * @param {string} [options.headers="*"] - The value for the `Access-Control-Allow-Headers` header.
 * 
 * @returns {Routes} A new `Routes` object where each route has CORS headers applied to its response.
 * 
 * @example
 * Bun.serve({
 *     port: 8080,
 *     development: true,
 *     routes : CORS({
 *         "/register": {
 *             POST: async (req: Bun.BunRequest<"/register">) => {
 *                // your code here...
 *             }
 *         },
 *         "/login": {
 *             POST: async (req) => {
 *                 // your code here...
 *             }
 *         },
 *         "/user/:id" : {
 *             GET: async (req: Bun.BunRequest<"/test/:id">) => {
 *                 return new Response(`Hi! User: ${req.params.id}`); 
 *                 // to use req params pass type to "req" like this
 *             }
 *         }
 *     }, {
 *         origin: "*",
 *         methods: "*",
 *         headers: "*" 
 *     })
 * });
 * 
 * @see https://bun.sh/docs/api/http#bun-serve
 * @see https://www.npmjs.com/package/bun-routes-cors
 */
export default function CORS(routes: Routes, options: CorsOptions = {}): Routes {
    const { origin = "*", methods = "*", headers = "*" } = options;

    const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": methods,
        "Access-Control-Allow-Headers": headers,
    };

    const wrappedRoutes: Routes = {};

    for (const path in routes) {
        const original = routes[path];

        if (typeof original === "function") {   // route handler function
            wrappedRoutes[path] = async (req: Bun.BunRequest<string>) => {
                const res = await original(req);
                if(!res) throw new Error("Response not specified");
                for (const [key, value] of Object.entries(corsHeaders)) {
                    res.headers.set(key, value);
                }
                return res;
            };

        } else if (original instanceof Response) {  // new Response
            wrappedRoutes[path] = async () => {
                const newRes = new Response(null, {
                    status: original.status,
                    statusText: original.statusText,
                    headers: new Headers(original.headers),
                });

                for (const [key, value] of Object.entries(corsHeaders)) {
                    newRes.headers.set(key, value);
                }

                return newRes;
            };

        } else if (typeof original === "object" && original !== null) { // res objects with method
            wrappedRoutes[path] = {};

            for (const [method, handler] of Object.entries(original)) {
                if (allowedMethods.includes(method as HTTPMethod)) {
                    const typedMethod = method as HTTPMethod;
                    wrappedRoutes[path][typedMethod] = async (req: Bun.BunRequest<string>) => { // string path, like </asd/:id>
                        const res = await handler!(req);
                        if(!res) throw new Error("Response not specified");
                        for (const [key, value] of Object.entries(corsHeaders)) {
                            res.headers.set(key, value);
                        }
                        return res;
                    };
                }
            }

            // preflight
            if (!wrappedRoutes[path]["OPTIONS"]) {
                wrappedRoutes[path]["OPTIONS"] = async () =>
                    new Response(null, {
                        status: 204,
                        headers: corsHeaders,
                    });
            }
        }
    }

    return wrappedRoutes;
}
