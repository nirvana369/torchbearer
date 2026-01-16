// eslint-rules/no-bigint-in-query-keys.js

import { getParserServices } from '@typescript-eslint/utils/eslint-utils';
import ts from 'typescript';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow BigInt in TanStack Query keys',
            recommended: true
        },
        fixable: 'code',
        messages: {
            bigIntInQueryKey: 'BigInt detected in query key. Use .toString() to convert it.'
        },
        schema: []
    },
    create(context) {
        const sourceCode = context.getSourceCode();

        // Get parser services - this will handle TypeScript availability checks
        const services = getParserServices(context);
        const typeChecker = services.program.getTypeChecker();

        return {
            CallExpression(node) {
                const queryHooks = ['useQuery', 'useMutation', 'useInfiniteQuery', 'useSuspenseQuery'];

                const calleeName =
                    node.callee.type === 'Identifier'
                        ? node.callee.name
                        : node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier'
                          ? node.callee.property.name
                          : null;

                if (!calleeName || !queryHooks.includes(calleeName)) return;

                // Find queryKey in options
                const options = node.arguments[0];
                if (!options || options.type !== 'ObjectExpression') return;

                const queryKeyProp = options.properties.find(
                    (prop) => prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'queryKey'
                );

                if (queryKeyProp && queryKeyProp.value) {
                    checkForBigInt(queryKeyProp.value);
                }

                function checkForBigInt(node) {
                    // Skip spread elements and null/undefined
                    if (!node || node.type === 'SpreadElement') return;

                    // For composite structures, check elements recursively first
                    // Don't check the type of the composite structure itself
                    if (node.type === 'ArrayExpression') {
                        node.elements.forEach((element) => {
                            if (element) checkForBigInt(element);
                        });
                        return; // Don't check the array type itself
                    } else if (node.type === 'ObjectExpression') {
                        node.properties.forEach((property) => {
                            if (property.type === 'Property' && property.value) {
                                checkForBigInt(property.value);
                            }
                        });
                        return; // Don't check the object type itself
                    } else if (node.type === 'TemplateLiteral') {
                        node.expressions.forEach((expr) => {
                            checkForBigInt(expr);
                        });
                        return; // Don't check the template literal type itself
                    } else if (node.type === 'ConditionalExpression') {
                        checkForBigInt(node.consequent);
                        checkForBigInt(node.alternate);
                        return; // Don't check the conditional expression type itself
                    } else if (node.type === 'LogicalExpression') {
                        checkForBigInt(node.left);
                        checkForBigInt(node.right);
                        return; // Don't check the logical expression type itself
                    }

                    // Only check types for leaf nodes (not composite structures)
                    // Get TypeScript type for this node using the services
                    const tsNode = services.esTreeNodeToTSNodeMap.get(node);
                    if (!tsNode) return;

                    const type = typeChecker.getTypeAtLocation(tsNode);

                    // Check if the type is bigint
                    if (isBigIntType(type)) {
                        context.report({
                            node,
                            messageId: 'bigIntInQueryKey',
                            fix(fixer) {
                                const nodeText = sourceCode.getText(node);

                                // Handle different node types appropriately
                                if (node.type === 'Literal' && typeof node.value === 'bigint') {
                                    // For BigInt literals like 123n
                                    return fixer.replaceText(node, `${nodeText}.toString()`);
                                } else if (
                                    node.type === 'CallExpression' &&
                                    node.callee.type === 'Identifier' &&
                                    node.callee.name === 'BigInt'
                                ) {
                                    // For BigInt() constructor calls
                                    return fixer.replaceText(node, `${nodeText}.toString()`);
                                } else {
                                    // For variables and other expressions
                                    return fixer.replaceText(node, `${nodeText}.toString()`);
                                }
                            }
                        });
                    }
                }

                function isBigIntType(type) {
                    // Get the string representation of the type
                    const typeString = typeChecker.typeToString(type);

                    // Check if it's literally "bigint"
                    if (typeString === 'bigint') {
                        return true;
                    }

                    // Check for bigint in union types (e.g., "string | bigint")
                    if (typeString.includes('bigint')) {
                        return true;
                    }

                    // Use TypeScript type flags for more reliable detection
                    if (ts.TypeFlags) {
                        // Check for BigInt literal type
                        if (type.flags & ts.TypeFlags.BigIntLiteral) {
                            return true;
                        }
                        // Check for generic bigint type
                        if (type.flags & ts.TypeFlags.BigInt) {
                            return true;
                        }
                    }

                    // Check for union types that might contain bigint
                    if (type.isUnion?.()) {
                        return type.types.some((t) => isBigIntType(t));
                    }

                    // Check for intersection types
                    if (type.isIntersection?.()) {
                        return type.types.some((t) => isBigIntType(t));
                    }

                    return false;
                }
            }
        };
    }
};
