/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const fs = require('fs/promises');

const esbuild = require("esbuild");
const { clean } = require('esbuild-plugin-clean');

const { NodeModulesPolyfillPlugin } = require('@esbuild-plugins/node-modules-polyfill');
const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill');

const manifest = require('./public/manifest.json');
const packageJson = require('./package.json');

(async () => {
    manifest.version = packageJson.version; // Usually no-op, except during 'npm version'
    await fs.writeFile(path.join('.', 'public', 'manifest.json'), JSON.stringify(manifest, null, 4));

    const result = await esbuild.build({
        entryPoints: [
            "./src/background.ts",
            "./src/content-script.ts",
            "./src/injected-script.ts"
        ],
        bundle: true,
        metafile: true,
        outdir: "./public/build",
        sourcemap: !!process.env.DEV_MODE,
        watch: !!process.env.DEV_MODE,
        external: ['brotli-wasm'],
        plugins: [
            NodeModulesPolyfillPlugin(),
            NodeGlobalsPolyfillPlugin({
                process: true,
                buffer: true
            }),
            clean({
                patterns: [
                    './public/build/**/*',
                    './public/config/**/*',
                ]
            })
        ]
    })
    .catch(() => process.exit(1));

    console.log(await esbuild.analyzeMetafile(result.metafile));
})();