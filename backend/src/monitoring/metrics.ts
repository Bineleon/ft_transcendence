import fp from "fastify-plugin";
import client from "prom-client";

export default fp(async function metricsPlugin(fastify) {
    const register = new client.Registry();

    // Collect default Node.js process metrics
    client.collectDefaultMetrics({ register });

    // --- 1) Counter: HTTP requests ---
    const httpRequestsTotal = new client.Counter({
        name: "http_requests_total",
        help: "Total number of HTTP requests",
        labelNames: ["method", "route", "status_code"],
    });
    register.registerMetric(httpRequestsTotal);

    // --- 2) Histogram: Request duration ---
    const httpRequestDuration = new client.Histogram({
        name: "http_request_duration_seconds",
        help: "Duration of HTTP requests in seconds",
        labelNames: ["method", "route", "status_code"],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    });
    register.registerMetric(httpRequestDuration);

    // Hook: start time
    fastify.addHook("onRequest", (req, _, done) => {
        req.startTime = process.hrtime(); // [seconds, nanoseconds]
        done();
    });

    // Hook: record metrics after response
    fastify.addHook("onResponse", (req, reply, done) => {
        const route = req.routeOptions?.url || req.raw.url;
        const status = reply.statusCode;

        // Counter
        httpRequestsTotal.inc({ method: req.method, route, status_code: status });

        // Duration
        if (req.startTime) {
            const diff = process.hrtime(req.startTime);
            const duration = diff[0] + diff[1] / 1e9;
            httpRequestDuration.observe(
                { method: req.method, route, status_code: status },
                duration
            );
        }

        done();
    });

    // Expose /metrics endpoint
    fastify.get("/metrics", async (_, reply) => {
        reply.type(register.contentType).send(await register.metrics());
    });
});
