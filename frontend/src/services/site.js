const configured = (process.env.REACT_APP_SITE_URL || 'https://www.cezarehberi.com').replace(/\/$/, '');
export const SITE_URL = /^https:\/\/(www\.)?trafikrehber\.com$/.test(configured) ? 'https://www.cezarehberi.com' : configured;
export const CATEGORY_NAMES = { ceza: 'Trafik Cezaları', sigorta: 'Sigorta', ehliyet: 'Ehliyet', 'arac-islemleri': 'Araç İşlemleri', genel: 'Rehber' };
export const PAYMENT_URL = 'https://www.turkiye.gov.tr/gib-intvrg-trafik-para-cezasi-borcu-sorgulama-ve-odeme';
