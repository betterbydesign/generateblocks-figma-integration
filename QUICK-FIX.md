# Quick Fix for ES6 Syntax Error

## The Problem

You got this error:
```
Syntax error on line 137: Unexpected token ...
color: { ...color, a: 0.25 },
```

This is because Figma's plugin sandbox doesn't fully support ES6 object spread syntax.

## The Solution

You need to update 2 files in your local repo:

### 1. Update `figma-plugin/src/converter.ts`

Find line ~157 that says:
```typescript
color: { ...color, a: 0.25 },
```

Replace it with:
```typescript
color: { r: color.r, g: color.g, b: color.b, a: 0.25 },
```

### 2. Update `figma-plugin/tsconfig.json` (Optional but recommended)

Change:
```json
"target": "ES2020",
"module": "ESNext",
```

To:
```json
"target": "ES2017",
"module": "CommonJS",
```

## Rebuild

```bash
cd /Users/scottfoster/git/generateblocks-figma-integration/figma-plugin
npm run build
```

## Reload in Figma

In Figma Desktop:
- **Plugins** → **Development** → **Reload plugin** (or press Cmd+Option+P on Mac)

The error should be gone!

---

## Alternative: Copy Updated converter.ts

If you want the complete updated file, see `MANUAL-SYNC-GUIDE.md` - it has the full corrected version of `converter.ts`.
