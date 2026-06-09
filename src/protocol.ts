import { removeSpaces, stringHasLength } from './utils';
import type { AMIAction, AMIEvent } from './types';

const parseLines = (lines: string[]): AMIEvent => {
  const item: AMIEvent = {};

  for (const raw of lines.filter(stringHasLength)) {
    const colonIdx = raw.indexOf(': ');
    if (colonIdx === -1) continue;

    const key = removeSpaces(raw.slice(0, colonIdx)).toLowerCase();
    const val = raw.slice(colonIdx + 2);

    if (key === 'variable' || key === 'chanvariable') {
      if (typeof item[key] !== 'object' || Array.isArray(item[key])) {
        item[key] = {} as Record<string, string>;
      }
      const eqIdx = val.indexOf('=');
      const subkey = eqIdx >= 0 ? val.slice(0, eqIdx) : val;
      const subval = eqIdx >= 0 ? val.slice(eqIdx + 1) : '';
      (item[key] as Record<string, string>)[subkey] = subval;
    } else if (key in item) {
      if (Array.isArray(item[key])) {
        (item[key] as string[]).push(val);
      } else {
        item[key] = [item[key] as string, val];
      }
    } else {
      item[key] = val;
    }
  }

  return item;
};

const buildActionMessage = (req: AMIAction, id: string): string => {
  const msg: string[] = [`ActionID: ${id}`];

  for (const [key, val] of Object.entries(req)) {
    const nkey = removeSpaces(key).toLowerCase();
    if (!nkey.length || nkey === 'actionid' || val === undefined) continue;

    const capitalKey = nkey[0].toUpperCase() + nkey.slice(1);

    if (Array.isArray(val)) {
      msg.push(`${capitalKey}: ${val.map(String).join(',')}`);
    } else if (typeof val === 'object') {
      for (const [name, v] of Object.entries(val)) {
        msg.push(`${capitalKey}: ${name}=${v}`);
      }
    } else {
      msg.push(`${capitalKey}: ${val}`);
    }
  }

  return msg.join('\r\n') + '\r\n\r\n';
};

export { parseLines, buildActionMessage };
