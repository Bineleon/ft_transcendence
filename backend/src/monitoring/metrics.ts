// @ts-nocheck
import fp from "fastify-plugin";
import client from "prom-client";
import { getPrismaClient } from "../shared/database/prisma.js";
import { registerPrismaMetrics } from "./prisma.metrics.js";

async function metricsPlugin(fastify) {
    const register = new client.Registry();
    const prisma = getPrismaClient();
    registerPrismaMetrics(prisma, register);

    // Collect default Node.js + V8 metrics
    client.collectDefaultMetrics({ register });

    // --- COUNTER: HTTP Requests ---
    const httpRequestsTotal = new client.Counter({
        name: "http_requests_total",
        help: "Total number of HTTP requests",
        labelNames: ["method", "route", "status_code"],
    });
    register.registerMetric(httpRequestsTotal);

    // --- HISTOGRAM: Request Duration ---
    const httpRequestDuration = new client.Histogram({
        name: "http_request_duration_seconds",
        help: "Duration of HTTP requests in seconds",
        labelNames: ["method", "route", "status_code"],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    });
    register.registerMetric(httpRequestDuration);

    // Start time
    fastify.addHook("onRequest", (req, _, done) => {
        // store precise time for duration measurement
        req.startTime = process.hrtime();

        done();
    });

    // Extract best possible route name
    function getRouteName(req) {
        return (
            req.routerPath ||                      // Fastify internal (best)
            req.context?.config?.url ||            // Most accurate fallback
            req.routeOptions?.url ||               // Classic fallback
            req.raw.url                            // Real URL (last fallback)
        );
    }

    fastify.addHook("onResponse", (req, reply, done) => {
        const route = getRouteName(req);

        // Ignore /metrics itself (avoid breaking dashboards)
        if (route === "/metrics") {
            done();
            return;
        }

        const status = reply.statusCode;

        // --- Counter increment ---
        httpRequestsTotal.inc({
            method: req.method,
            route,
            status_code: status,
        });

        // --- Duration ---
        if (req.startTime) {
            const diff = process.hrtime(req.startTime);
            const durationSeconds = diff[0] + diff[1] / 1e9;

            httpRequestDuration.observe(
                { method: req.method, route, status_code: status },
                durationSeconds
            );
        }

        done();
    });

    // /metrics endpoint
    fastify.get("/metrics", async (_, reply) => {
        reply.type(register.contentType).send(await register.metrics());
    });
}

// Ensure plugin loads AFTER all routes, so fastify.routerPath is valid
export default fp(metricsPlugin, {
    name: "metrics-plugin",
    encapsulate: false
});

