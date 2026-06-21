/**
 * base44Client.js — now a thin re-export of breadClient.
 *
 * Every page that does `import { base44 } from '@/api/base44Client'`
 * automatically gets the real backend client with zero changes required.
 */
export { breadClient as base44 } from './breadClient';
