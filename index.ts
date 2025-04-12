// Bun Router CORS v0.1
// by: mcitomi ~ www.mcitomi.hu ~ dc.mcitomi.hu
// salted by copilot

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

const allowedMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

type RouteHandler<Path extends string> = (req: Bun.BunRequest<Path>) => Response | Promise<Response>;

type Route<Path extends string> = {
    [M in HTTPMethod]?: RouteHandler<Path>;
};

type Routes = {
    [Path in string]: Route<Path>;
};

interface CorsOptions {
    origin?: string;
    methods?: string;
    headers?: string;
}

export default function CORS(routes: Routes, options: CorsOptions = {}): Routes {
    const { origin = "*", methods = "*", headers = "*", } = options;

    const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": methods,
        "Access-Control-Allow-Headers": headers,
    };

    const wrappedRoutes: Routes = {};

    for (const path in routes) {
        wrappedRoutes[path] = {};

        for (const [method, handler] of Object.entries(routes[path])) {
            if (allowedMethods.includes(method as HTTPMethod)) {
                const typedMethod = method as HTTPMethod;
                wrappedRoutes[path][typedMethod] = async (req: Bun.BunRequest<string>) => {
                    const response = await handler(req as Bun.BunRequest<string>);
                    for (const [key, value] of Object.entries(corsHeaders)) {
                        response.headers.set(key, value);
                    }
                    return response;
                };
            }
        }

        if (!wrappedRoutes[path]["OPTIONS"]) {
            wrappedRoutes[path]["OPTIONS"] = async () =>
                new Response(null, {
                    status: 204,
                    headers: corsHeaders,
                });
        }
    }

    return wrappedRoutes;
}