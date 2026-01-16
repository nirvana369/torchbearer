// eslint-rules/require-internet-identity-provider.js

import fs from 'fs';
import path from 'path';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Ensure InternetIdentityProvider is present when using Internet Identity hooks',
            recommended: true
        },
        messages: {
            hookUsedWithoutProvider:
                "Using {{hookName}}. Make sure InternetIdentityProvider is added in main.tsx or App.tsx. E.g. <InternetIdentityProvider> <App /> </InternetIdentityProvider>.  Import it using: import { useInternetIdentity } from './hooks/useInternetIdentity'"
        },
        schema: [
            {
                type: 'object',
                properties: {
                    checkAllFiles: {
                        type: 'boolean',
                        default: true
                    }
                },
                additionalProperties: false
            }
        ]
    },
    create(context) {
        const options = context.options[0] || {};
        const checkAllFiles = options.checkAllFiles !== false;
        const filename = context.getFilename();
        const hookUsages = [];
        const identityHooks = ['useInternetIdentity', 'useAuthClient', 'useIdentity', 'useAuth'];
        const importedHooks = new Set();

        // Cache for provider check across files
        let providerCheckCache = null;

        // Determine if an import source refers to the Internet Identity hook module
        function isInternetIdentityHookSource(sourceValue) {
            if (typeof sourceValue !== 'string') return false;
            // Legacy package name
            if (sourceValue === 'ic-use-internet-identity') return true;
            // Any path (relative or alias) that ends with hooks/useInternetIdentity(.ts|.tsx|.js|.jsx)
            const normalized = sourceValue.replace(/\\/g, '/');
            return /(^|\/)hooks\/useInternetIdentity(\.(t|j)sx?)?$/.test(normalized);
        }

        // Function to check if provider exists in main.tsx or App.tsx
        function checkProviderInEntryFiles() {
            if (providerCheckCache !== null) {
                return providerCheckCache;
            }

            const cwd = context.getCwd ? context.getCwd() : process.cwd();
            const srcDir = path.join(cwd, 'src');
            const filesToCheck = ['main.tsx', 'App.tsx'];

            for (const file of filesToCheck) {
                const filePath = path.join(srcDir, file);
                try {
                    if (fs.existsSync(filePath)) {
                        const content = fs.readFileSync(filePath, 'utf8');
                        // Check for InternetIdentityProvider usage
                        if (content.includes('InternetIdentityProvider')) {
                            // More specific check for JSX usage
                            const providerRegex = /<InternetIdentityProvider[\s>]/;
                            if (providerRegex.test(content)) {
                                providerCheckCache = true;
                                return true;
                            }
                        }
                    }
                } catch (error) {
                    // Ignore file read errors
                }
            }

            providerCheckCache = false;
            return false;
        }

        return {
            // Check for imports from ic-use-internet-identity
            ImportDeclaration(node) {
                if (isInternetIdentityHookSource(node.source.value)) {
                    node.specifiers.forEach((spec) => {
                        if (spec.type === 'ImportSpecifier' && identityHooks.includes(spec.imported.name)) {
                            importedHooks.add(spec.imported.name);
                        }
                    });
                }
            },

            // Check for hook usage
            CallExpression(node) {
                if (node.callee.type === 'Identifier' && importedHooks.has(node.callee.name)) {
                    hookUsages.push({
                        node: node,
                        hookName: node.callee.name
                    });
                }
            },

            // Check at the end of the file
            'Program:exit'() {
                if (hookUsages.length === 0) return;

                // Check if provider exists in main.tsx or App.tsx
                const hasProviderInEntryFiles = checkProviderInEntryFiles();

                if (checkAllFiles && !hasProviderInEntryFiles) {
                    // Only report once per file to avoid spam
                    context.report({
                        node: hookUsages[0].node,
                        messageId: 'hookUsedWithoutProvider',
                        data: {
                            hookName: hookUsages[0].hookName
                        }
                    });
                }
            }
        };
    }
};
