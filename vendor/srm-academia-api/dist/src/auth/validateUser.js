"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = validateUser;
async function validateUser(username) {
    try {
        const res = await fetch(`https://academia.srmist.edu.in/accounts/p/40-10002227248/signin/v2/lookup/${username}`, {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
                "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": '"Android"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-zcsrf-token": "iamcsrcoo=3dea6395-0540-44ea-8de7-544256dd7549",
                cookie: "zalb_74c3a1eecc=50830239914cba1225506e915a665a91; zccpn=68703e7d-ccf0-42ba-92b2-9c87c7a0c8ae; JSESSIONID=739937C3826C1F58C37186170B4F4B36; cli_rgn=IN; _ga=GA1.3.1846200817.1748679237; _gid=GA1.3.734795940.1748679237; _gat=1; _ga_HQWPLLNMKY=GS2.3.s1748679237$o1$g0$t1748679237$j60$l0$h0; zalb_f0e8db9d3d=983d6a65b2f29022f18db52385bfc639; iamcsr=3dea6395-0540-44ea-8de7-544256dd7549; _zcsr_tmp=3dea6395-0540-44ea-8de7-544256dd7549; stk=4ec13d42454007681bd4337cf126baec",
                Referer: "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&servicename=ZohoCreator&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            body: `mode=primary&cli_time=${Date.now()}&servicename=ZohoCreator&service_language=en&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin`,
            method: "POST",
        });
        const response = (await res.json());
        const data = {
            identifier: response.lookup?.identifier,
            digest: response.lookup?.digest,
            status_code: response.status_code,
            message: response.message,
        };
        return { data };
    }
    catch (e) {
        console.error(e);
        return {
            error: "Internal Server Error",
            errorReason: e,
        };
    }
}
//# sourceMappingURL=validateUser.js.map