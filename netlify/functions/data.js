import { getStore } from "@netlify/blobs";

function json(statusCode, body) {
    return {
        statusCode,
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(body)
    };
}

function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const clientsStore = getStore("clients");
const chemicalsStore = getStore("chemicals");
const applicationsStore = getStore("applications");
const settingsStore = getStore("settings");

async function listStore(store) {
    const listed = await store.list({ paginate: false });
    const blobs = listed?.blobs || [];
    const items = [];

    for (const blob of blobs) {
        const value = await store.get(blob.key, { type: "json" });
        if (value) items.push(value);
    }

    return items;
}

async function getSettings() {
    return (
        (await settingsStore.get("app", { type: "json" })) || {
            companyName: "",
            certifiedApplicatorName: "",
            certifiedApplicatorLicense: "",
            defaultCarrier: "Water"
        }
    );
}

async function clearStore(store) {
    const listed = await store.list({ paginate: false });
    const blobs = listed?.blobs || [];

    for (const blob of blobs) {
        await store.delete(blob.key);
    }
}

export const handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const action = body.action;
        const payload = body.payload || {};

        if (action === "bootstrap") {
            const [settings, clients, chemicals, applications] = await Promise.all([
                getSettings(),
                listStore(clientsStore),
                listStore(chemicalsStore),
                listStore(applicationsStore)
            ]);

            return json(200, {
                ok: true,
                data: { settings, clients, chemicals, applications }
            });
        }

        if (action === "save_settings") {
            const settings = {
                companyName: payload.companyName || "",
                certifiedApplicatorName: payload.certifiedApplicatorName || "",
                certifiedApplicatorLicense: payload.certifiedApplicatorLicense || "",
                defaultCarrier: payload.defaultCarrier || "Water"
            };

            await settingsStore.setJSON("app", settings);
            return json(200, { ok: true, data: settings });
        }

        if (action === "upsert_client") {
            const item = { ...payload, id: payload.id || uid() };
            await clientsStore.setJSON(item.id, item);
            return json(200, { ok: true, data: item });
        }

        if (action === "bulk_upsert_clients") {
            const clients = Array.isArray(payload.clients) ? payload.clients : [];

            for (const client of clients) {
                const item = { ...client, id: client.id || uid() };
                await clientsStore.setJSON(item.id, item);
            }

            return json(200, { ok: true, data: { count: clients.length } });
        }

        if (action === "delete_client") {
            const id = payload.id;
            if (!id) return json(400, { ok: false, error: "Missing client id" });

            await clientsStore.delete(id);

            const listed = await applicationsStore.list({ paginate: false });
            for (const blob of listed?.blobs || []) {
                const app = await applicationsStore.get(blob.key, { type: "json" });
                if (app?.clientId === id) {
                    await applicationsStore.delete(blob.key);
                }
            }

            return json(200, { ok: true, data: { id } });
        }

        if (action === "upsert_chemical") {
            const item = { ...payload, id: payload.id || uid() };
            await chemicalsStore.setJSON(item.id, item);
            return json(200, { ok: true, data: item });
        }

        if (action === "delete_chemical") {
            const id = payload.id;
            if (!id) return json(400, { ok: false, error: "Missing chemical id" });

            await chemicalsStore.delete(id);
            return json(200, { ok: true, data: { id } });
        }

        if (action === "upsert_application") {
            const item = { ...payload, id: payload.id || uid() };
            await applicationsStore.setJSON(item.id, item);
            return json(200, { ok: true, data: item });
        }

        if (action === "delete_application") {
            const id = payload.id;
            if (!id) return json(400, { ok: false, error: "Missing application id" });

            await applicationsStore.delete(id);
            return json(200, { ok: true, data: { id } });
        }

        if (action === "replace_all") {
            const incomingSettings = payload.settings || {};
            const incomingClients = Array.isArray(payload.clients) ? payload.clients : [];
            const incomingChemicals = Array.isArray(payload.chemicals) ? payload.chemicals : [];
            const incomingApplications = Array.isArray(payload.entries || payload.applications)
                ? (payload.entries || payload.applications)
                : [];

            await clearStore(clientsStore);
            await clearStore(chemicalsStore);
            await clearStore(applicationsStore);

            await settingsStore.setJSON("app", {
                companyName: incomingSettings.companyName || "",
                certifiedApplicatorName: incomingSettings.certifiedApplicatorName || "",
                certifiedApplicatorLicense: incomingSettings.certifiedApplicatorLicense || "",
                defaultCarrier: incomingSettings.defaultCarrier || "Water"
            });

            for (const client of incomingClients) {
                const item = { ...client, id: client.id || uid() };
                await clientsStore.setJSON(item.id, item);
            }

            for (const chemical of incomingChemicals) {
                const item = { ...chemical, id: chemical.id || uid() };
                await chemicalsStore.setJSON(item.id, item);
            }

            for (const application of incomingApplications) {
                const item = { ...application, id: application.id || uid() };
                await applicationsStore.setJSON(item.id, item);
            }

            return json(200, { ok: true, data: { success: true } });
        }

        return json(400, { ok: false, error: "Unknown action" });
    } catch (error) {
        return json(500, {
            ok: false,
            error: error?.message || "Server error"
        });
    }
};