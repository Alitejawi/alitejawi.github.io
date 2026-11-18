import { site } from '../data/site';

// Visitor counting with GoatCounter (goatcounter.com): one small script, no cookies,
// no personal data. It is off until site.analytics.goatcounter holds a site code.
// SITE_GOATCOUNTER overrides the code for one build, which is how the tests switch it on.

const code = (process.env.SITE_GOATCOUNTER ?? site.analytics.goatcounter).trim();

if (code && !/^[a-z0-9][a-z0-9-]*$/i.test(code)) {
  throw new Error(`GoatCounter code "${code}" is not a site code. Use the part before ".goatcounter.com".`);
}

/** Where the counter reports to, or undefined while no code is set. */
export const goatcounter = code ? { endpoint: `https://${code}.goatcounter.com/count`, script: 'https://gc.zgo.at/count.js' } : undefined;
