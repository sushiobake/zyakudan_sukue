import { readFileSync, writeFileSync } from 'node:fs'

const levels = JSON.parse(readFileSync('content.json', 'utf8'))
writeFileSync('public/content.json', JSON.stringify(levels, null, 2), 'utf8')
console.log('Wrote public/content.json')
