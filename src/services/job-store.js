"use strict";

const crypto = require("crypto");

const JOB_TTL_MS = 10 * 60 * 1000;

class JobStore
{
    constructor()
    {
        this.jobs = new Map();
    }

    create()
    {
        const id = crypto.randomUUID();
        const job = {
            id,
            status: "processing",
            batch: 0,
            totalBatches: 0,
            downloadName: null,
            content: null,
            error: null,
            listeners: new Set(),
            createdAt: Date.now(),
            abortController: new AbortController(),
        };
        this.jobs.set(id, job);
        return job;
    }

    cancel(id)
    {
        const job = this.jobs.get(id);
        if (!job || job.status !== "processing") return false;

        job.status = "cancelled";
        job.abortController.abort();
        this.emit(id, { type: "cancelled" });
        this.scheduleCleanup(id);
        return true;
    }

    isCancelled(id)
    {
        return this.jobs.get(id)?.status === "cancelled";
    }

    get(id)
    {
        return this.jobs.get(id);
    }

    emit(id, event)
    {
        const job = this.jobs.get(id);
        if (!job) return;
        job.listeners.forEach((listener) => listener(event));
    }

    subscribe(id, listener)
    {
        const job = this.jobs.get(id);
        if (!job) return () => {};
        job.listeners.add(listener);
        return () => job.listeners.delete(listener);
    }

    setProgress(id, batch, totalBatches)
    {
        const job = this.jobs.get(id);
        if (!job) return;
        job.batch = batch;
        job.totalBatches = totalBatches;
        this.emit(id, { type: "progress", batch, totalBatches });
    }

    setDone(id, { content, downloadName })
    {
        const job = this.jobs.get(id);
        if (!job || job.status === "cancelled") return;
        job.status = "done";
        job.content = content;
        job.downloadName = downloadName;
        this.emit(id, { type: "done", downloadName });
        this.scheduleCleanup(id);
    }

    setError(id, message)
    {
        const job = this.jobs.get(id);
        if (!job || job.status === "cancelled") return;
        job.status = "error";
        job.error = message;
        this.emit(id, { type: "error", message });
        this.scheduleCleanup(id);
    }

    scheduleCleanup(id)
    {
        setTimeout(() => this.jobs.delete(id), JOB_TTL_MS);
    }
}

module.exports = new JobStore();
