"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = validatePassword;
async function validatePassword({ identifier, digest, password, }) {
    try {
        const res = await fetch(`https://academia.srmist.edu.in/accounts/p/40-10002227248/signin/v2/primary/${identifier}/password?digest=${digest}&cli_time=${Date.now()}&servicename=ZohoCreator&service_language=en&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin`, {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-zcsrf-token": "iamcsrcoo=fae2d8fa-e5a1-4cb0-a5ee-cc40af87e89f",
                cookie: "zalb_74c3a1eecc=4cad43ac9848cc7edd20d2313fcde774; zccpn=a6fa7bc8-11c7-44ad-8be8-0aa6b04fad8a; JSESSIONID=3BD0053672AF3D628D983A15AA469D07; cli_rgn=IN; _ga=GA1.3.2061081340.1748689001; _gid=GA1.3.1677956689.1748689001; _ga_HQWPLLNMKY=GS2.3.s1748689001$o1$g0$t1748689001$j60$l0$h0; zalb_f0e8db9d3d=7ad3232c36fdd9cc324fb86c2c0a58ad; iamcsr=fae2d8fa-e5a1-4cb0-a5ee-cc40af87e89f; _zcsr_tmp=fae2d8fa-e5a1-4cb0-a5ee-cc40af87e89f; stk=d6559e9a58e77dbea9e24adf3bb57941",
                Referer: "https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&servicename=ZohoCreator&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            body: `{"passwordauth":{"password":"${password}"}}`,
            method: "POST",
        });
        const response = (await res.json());
        if (response.status_code === 201) {
            // Use filterCookies to process set-cookie header
            const setCookieHeader = res.headers.get("set-cookie");
            if (!setCookieHeader)
                throw new Error("Couldn't able to get cookie from response header ");
            const matches = [
                ...setCookieHeader.matchAll(/(_(?:iamadt|iambdt)_client_\d+|_z_identity)=[^;]+/g),
            ];
            const extractedCookies = matches.map((m) => m[0]).join("; ") + ";";
            const data = {
                cookies: extractedCookies,
                statusCode: 201,
            };
            return { data, isAuthenticated: true };
        }
        const captchaRequired = response.localized_message
            ?.toLowerCase()
            ?.includes("captcha")
            ? true
            : false;
        const data = {
            statusCode: response.status_code,
            message: response.localized_message,
            captcha: captchaRequired
                ? { required: true, digest: response.cdigest }
                : { required: false, digest: null },
        };
        return { data, isAuthenticated: false };
    }
    catch (e) {
        return { error: "Internal Server Error", errorReason: e };
    }
}
//# sourceMappingURL=validatePassword.js.map