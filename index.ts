// Bun Router CORS v0.2
// Supports all docs described response https://bun.sh/docs/api/http#bun-serve
// by: mcitomi ~ www.mcitomi.hu ~ dc.mcitomi.hu
// salted by copilot, chatgpt etc.

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
