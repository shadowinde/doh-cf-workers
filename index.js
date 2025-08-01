// SPDX-License-Identifier: 0BSD

const doh = 'https://dns.google/dns-query'
const dohjson = 'https://dns.google/resolve?'
const contype = 'application/dns-message'
const jstontype = 'application/dns-json'
const path = ''; // default allow all, must start with '/' if specified, eg. "/dns-query"
const r404 = new Response(null, {status: 404});

// developers.cloudflare.com/workers/runtime-apis/fetch-event/#syntax-module-worker
export default {
    async fetch(r, env, ctx) {
        return handleRequest(r);
    },
};

async function handleRequest(request) {
    // when res is a Promise<Response>, it reduces billed wall-time
    // blog.cloudflare.com/workers-optimization-reduces-your-bill
    let res = r404;
    const { method, headers, url } = request
    const {searchParams, pathname} = new URL(url)
    
    //Check path
    if (!pathname.startsWith(path)) {
        return r404;
    }
    if (method == 'GET' && searchParams.has('dns')) {
        res = fetch(doh + '?dns=' + searchParams.get('dns'), {
            method: 'GET',
            headers: {
                'Accept': contype,
            }
        });
    } else if (method === 'POST' && headers.get('content-type') === contype) {
        // streaming out the request body is optimal than awaiting on it
        const rostream = request.body;
        res = fetch(doh, {
            method: 'POST',
            headers: {
                'Accept': contype,
                'Content-Type': contype,
            },
            body: rostream,
        });
    } else if (method === 'GET' && headers.get('Accept') === jstontype) {
        const search = new URL(url).search
         res = fetch(dohjson + search, {
            method: 'GET',
            headers: {
                'Accept': jstontype,
            }
        });
    }
    return res;
}
