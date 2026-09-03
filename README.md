# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Project conventions

### Navigation
The app is a string-based `subView` state machine in `src/App.jsx` (no react-router). Each subview value is a full-page screen, e.g. `workOrderCreate`, `workOrderDetail`, `propertyDetail`, `propertyCreate`, `complianceDetail`, `complianceCreate`, `assetDetail`, `assetCreate`, `assetEdit`. The chosen page is rendered through the `PageComponent` switch, which passes navigation callbacks as props.

### Pages
- **Every create / detail / edit screen is a full-page subview** registered in `App.jsx`. Inline modals/forms are moved to their own subview files (see `src/pages/AssetForm.jsx`, `ComplianceCreate.jsx`, `propertyCreate`).
- **List pages receive callbacks as props** and never hold their own navigation state: `onCreateX`, `onViewX(id)`, `onEditX(id)`, `onRemoveX(id)`.
- **Shared editing state is lifted to `App`** (e.g. `assets` / `setAssets`). Detail pages read data from a lifted `assets` / `properties` prop rather than a module constant.
- Shared reusable UI lives in `src/components/` (Pagination, Sidebar, ComboBox, MultiSelectDropdown, ...).

### Data maps
Pure dashboard data maps (status lists, type/category key maps, etc.) are centralized in `src/data/` (e.g. `workOrders.js`, `district.js`) rather than duplicated per page. Import them instead of redeclaring local copies.

### i18n
- Two dictionaries: `src/i18n/translations/en.json` and `zh.json`, using **flat dotted keys** (e.g. `"assets.form.title"`, `"common.save"`).
- Keys are organised **per-page namespaces** (`workOrderCreate.*`, `workOrderDetail.*`, `propertyDetail.*`, `assetDetail.*`, ...) plus a shared `common.*` namespace for reused strings (Save, Cancel, Back, View, Download, etc.).
- Use the `useTranslation()` hook and `t(key, { placeholder })` (interpolates `{placeholder}`), with real UTF-8 Chinese values in `zh.json`.
- When adding keys, always add the **same key to both `en.json` and `zh.json`** to keep the two dictionaries symmetric.

### Verification
- `npm run lint` (oxlint) — must be warning/error free for changed files.
- `npm run build` (vite) — must succeed.
- `npm test` (vitest, currently 71 tests) — must all pass.
- After editing either translation file, validate JSON: `node -e "JSON.parse(require('fs').readFileSync('src/i18n/translations/en.json'))"` (and `zh.json`).
