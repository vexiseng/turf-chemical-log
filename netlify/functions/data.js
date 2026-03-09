import { getStore } from "@netlify/blobs";

const clientsStore = getStore("clients");
const chemicalsStore = getStore("chemicals");
const appsStore = getStore("applications");
const settingsStore = getStore("settings");

function uid() {
    return Date.now() + "-" + Math.random().toString(36).substring(2);
}

export const handler = async (event) => {

    const body = JSON.parse(event.body || "{}");
    const action = body.action;
    const payload = body.payload || {};

    if (action === "bootstrap") {

        const clients = await clientsStore.list();
        const chemicals = await chemicalsStore.list();
        const apps = await appsStore.list();

        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                data: {
                    clients: clients.blobs || [],
                    chemicals: chemicals.blobs || [],
                    applications: apps.blobs || [],
                    settings: {}
                }
            })
        };
    }

    if (action === "upsert_client") {

        const client = { ...payload, id: payload.id || uid() };
        await clientsStore.setJSON(client.id, client);

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true })
        };
    }

    if (action === "upsert_application") {

        const app = { ...payload, id: payload.id || uid() };
        await appsStore.setJSON(app.id, app);

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true })
        };
    }

    if (action === "upsert_chemical") {

        const chem = { ...payload, id: payload.id || uid() };
        await chemicalsStore.setJSON(chem.id, chem);

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true })
        };
    }

    return {
        statusCode: 400,
        body: JSON.stringify({ error: "unknown action" })
    };

};