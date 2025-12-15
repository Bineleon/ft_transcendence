// @ts-nocheck
import client from "prom-client";
import { PrismaClient } from "@prisma/client";

export function registerPrismaMetrics(
    prisma: PrismaClient,
    register: client.Registry
) {
    // --- COUNTER: total queries ---
    const prismaQueriesTotal = new client.Counter({
        name: "prisma_queries_total",
        help: "Total number of Prisma queries",
        labelNames: ["model", "action", "success"],
    });

    // --- COUNTER: errors ---
    const prismaErrorsTotal = new client.Counter({
        name: "prisma_errors_total",
        help: "Total number of Prisma errors",
        labelNames: ["model", "action"],
    });

    // --- HISTOGRAM: duration ---
    const prismaQueryDuration = new client.Histogram({
        name: "prisma_query_duration_seconds",
        help: "Duration of Prisma queries",
        labelNames: ["model", "action"],
        buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
    });

    register.registerMetric(prismaQueriesTotal);
    register.registerMetric(prismaErrorsTotal);
    register.registerMetric(prismaQueryDuration);

    // --- Prisma query hook ---
    prisma.$on("query", (e) => {
        const durationSeconds = e.duration / 1000;

        prismaQueriesTotal.inc({
            model: e.model ?? "raw",
            action: e.action ?? "unknown",
            success: "true",
        });

        prismaQueryDuration.observe(
            {
                model: e.model ?? "raw",
                action: e.action ?? "unknown",
            },
            durationSeconds
        );
    });

    // --- Prisma error hook ---
    prisma.$on("error", (e) => {
        prismaErrorsTotal.inc({
            model: e.model ?? "unknown",
            action: e.action ?? "unknown",
        });
    });
}
