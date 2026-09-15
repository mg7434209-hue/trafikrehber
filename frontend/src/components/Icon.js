import React from 'react';
const paths = {
  arrow: 'M5 12h14m-6-6 6 6-6 6', search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Zm-4 9 3 3 5-6',
  document: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h8',
  calculator: 'M5 2h14v20H5V2Zm3 4h8v4H8V6Zm0 8h1m6 0h1m-8 4h1m6 0h1',
  car: 'm5 7 2-4h10l2 4 2 3v8H3v-8l2-3Zm0 0h14M3 13h18M6 17v4m12-4v4M6 10h2m8 0h2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm4-4a4 4 0 0 1 0 8',
  book: 'M12 5v16m0-16C8 2 3 3 2 3v17c5-1 7-1 10 1 3-2 5-2 10-1V3c-1 0-6-1-10 2Z',
  clock: 'M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  menu: 'M4 6h16M4 12h16M4 18h16', close: 'm6 6 12 12M6 18 18 6', road: 'm7 2-4 20M17 2l4 20M12 3v3m0 4v4m0 4v3',
};
export default function Icon({ name, size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow} /></svg>;
}
