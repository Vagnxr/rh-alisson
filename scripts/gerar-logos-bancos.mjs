#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'bancos');

const bancos = [
  { id: 'bb', cor: '#FFEF00', initial: 'BB' },
  { id: 'caixa', cor: '#005CA9', initial: 'CE' },
  { id: 'bradesco', cor: '#CC092F', initial: 'BR' },
  { id: 'itau', cor: '#EC7000', initial: 'IT' },
  { id: 'santander', cor: '#EC0000', initial: 'SA' },
  { id: 'nubank', cor: '#820AD1', initial: 'NU' },
  { id: 'inter', cor: '#FF7A00', initial: 'IN' },
  { id: 'c6', cor: '#1A1A1A', initial: 'C6' },
  { id: 'picpay', cor: '#21C25E', initial: 'PI' },
  { id: 'mercadopago', cor: '#009EE3', initial: 'MP' },
  { id: 'pagbank', cor: '#00A94F', initial: 'PA' },
  { id: 'sicoob', cor: '#003641', initial: 'SI' },
  { id: 'sicredi', cor: '#33A02C', initial: 'SI' },
  { id: 'original', cor: '#00A551', initial: 'OR' },
  { id: 'btg', cor: '#001E62', initial: 'BT' },
  { id: 'safra', cor: '#003366', initial: 'SA' },
  { id: 'neon', cor: '#00E7F9', initial: 'NE' },
  { id: 'next', cor: '#00FF87', initial: 'NE' },
  { id: 'will', cor: '#FFDE59', initial: 'WI' },
  { id: 'xp', cor: '#000000', initial: 'XP' },
  { id: 'pan', cor: '#EB2D2D', initial: 'PA' },
  { id: 'bs2', cor: '#005CA9', initial: 'BS' },
  { id: 'stone', cor: '#0D0D0D', initial: 'ST' },
  { id: 'mercantil', cor: '#E31837', initial: 'ME' },
  { id: 'daycoval', cor: '#003366', initial: 'DA' },
  { id: 'sofisa', cor: '#003366', initial: 'SO' },
  { id: 'pine', cor: '#003366', initial: 'PI' },
  { id: 'modal', cor: '#00A651', initial: 'MO' },
  { id: 'votorantim', cor: '#CC0000', initial: 'VO' },
  { id: 'ribeirao', cor: '#003366', initial: 'RI' },
  { id: 'citibank', cor: '#056DAE', initial: 'CI' },
  { id: 'bmg', cor: '#E31837', initial: 'BM' },
  { id: 'digio', cor: '#7C3AED', initial: 'DI' },
  { id: 'renner', cor: '#E31837', initial: 'RE' },
  { id: 'ourinvest', cor: '#003366', initial: 'OU' },
  { id: 'banrisul', cor: '#E31837', initial: 'BA' },
  { id: 'bndes', cor: '#003366', initial: 'BN' },
  { id: 'nordeste', cor: '#009639', initial: 'NO' },
  { id: 'banestes', cor: '#003366', initial: 'BA' },
  { id: 'itau-unibanco', cor: '#EC7000', initial: 'IT' },
  { id: 'hipercard', cor: '#E31837', initial: 'HI' },
  { id: 'cargill', cor: '#00843D', initial: 'CA' },
  { id: 'fibra', cor: '#003366', initial: 'FI' },
  { id: 'genial', cor: '#FF6B00', initial: 'GE' },
  { id: 'fator', cor: '#003366', initial: 'FA' },
  { id: 'outros', cor: '#64748B', initial: '?' },
];

mkdirSync(outDir, { recursive: true });

function svgContent(cor, initial) {
  const textColor = cor === '#1A1A1A' || cor === '#0D0D0D' || cor === '#000000' ? '#FFFFFF' : (parseInt(cor.slice(1), 16) > 0x888888 ? '#FFFFFF' : '#333333');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="6" fill="${cor}"/>
  <text x="16" y="21" text-anchor="middle" fill="${textColor}" font-size="12" font-weight="bold" font-family="system-ui, sans-serif">${initial}</text>
</svg>`;
}

for (const b of bancos) {
  writeFileSync(join(outDir, `${b.id}.svg`), svgContent(b.cor, b.initial));
}
console.log(`Gerados ${bancos.length} logos em ${outDir}`);
