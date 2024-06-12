// fixme: move react stuff to react?
const getReactRules = () => ({
    "react/jsx-filename-extension": [1, { extensions: [".tsx"] }],
    "react/destructuring-assignment": "off",
    "react/jsx-props-no-spreading": "off",
    "react/no-unescaped-entities": "off",
    "react/no-array-index-key": "off",
    "react/button-has-type": "off",
    "react-hooks/rules-of-hooks": "error",
    "react/sort-comp": "off",
    "react/require-default-props": "off",
    "react/function-component-definition": "off",
    "react/no-danger": "off",
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
});

module.exports = {
    getA11yOffRules() {
        // eslint-disable-next-line import/no-extraneous-dependencies
        return Object.keys(require("eslint-plugin-jsx-a11y").rules).reduce((acc, rule) => {
            acc[`jsx-a11y/${rule}`] = "off";
            return acc;
        }, {});
    },
    getConfig(react) {
        return {
            extends: [
                react ? "airbnb" : "airbnb-base",
                "plugin:import/errors",
                "plugin:import/warnings",
                "plugin:import/typescript",
                "prettier",
            ],
            plugins: ["import", ...(react ? ["react-hooks"] : [])],
            rules: {
                // Standard
                radix: "off",
                "global-require": "off",
                "no-param-reassign": "off",
                "no-restricted-syntax": "off",
                "default-case": "off",
                "no-console": "off",
                "consistent-return": "off",
                "no-plusplus": "off",
                "class-methods-use-this": "off",
                "no-continue": "off",
                camelcase: "off",
                // Import
                "import/no-unresolved": "off", // already done by tsc
                "import/order": [
                    "error",
                    {
                        groups: [
                            ["external", "internal", "builtin"],
                            ["parent", "sibling", "index"],
                        ],
                        "newlines-between": "always",
                    },
                ],
                "import/prefer-default-export": "off",
                "import/extensions": ["error", { ts: "never", tsx: "never" }],
                ...(react ? getReactRules() : {}),
            },
            overrides: [
                {
                    files: ["*.{ts,tsx}"],
                    extends: ["plugin:@typescript-eslint/recommended"],
                    parser: "@typescript-eslint/parser",
                    parserOptions: {
                        project: true,
                        tsconfigRootDir: ".",
                    },
                    plugins: ["@typescript-eslint"],
                    rules: {
                        // Rules handled by typescript
                        "no-shadow": "off",
                        "no-use-before-define": "off",
                        "no-unused-expressions": "off",
                        "@typescript-eslint/no-unused-expressions": [
                            "error",
                            { allowShortCircuit: true, allowTernary: true },
                        ],
                        "no-dupe-class-members": "off",
                        "@typescript-eslint/no-dupe-class-members": ["error"],
                        "@typescript-eslint/camelcase": ["off"],
                        // TypeScript
                        "@typescript-eslint/no-shadow": "error",
                        "@typescript-eslint/consistent-type-assertions": [
                            "warn",
                            { assertionStyle: "as", objectLiteralTypeAssertions: "allow" },
                        ],
                        "@typescript-eslint/no-explicit-any": "off",
                        "@typescript-eslint/explicit-function-return-type": "off",
                        "@typescript-eslint/type-annotation-spacing": "error",
                        "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
                        "@typescript-eslint/default-param-last": "error",
                        "@typescript-eslint/explicit-module-boundary-types": "off",
                        "@typescript-eslint/naming-convention": [
                            "error",
                            {
                                selector: "typeParameter",
                                format: ["PascalCase"],
                                prefix: ["T"],
                                leadingUnderscore: "forbid",
                                trailingUnderscore: "forbid",
                            },
                            {
                                selector: "enumMember",
                                format: ["UPPER_CASE"],
                                leadingUnderscore: "forbid",
                                trailingUnderscore: "forbid",
                            },
                        ],
                        "@typescript-eslint/no-misused-promises": "error",
                        "@typescript-eslint/parameter-properties": "error",
                        // "@typescript-eslint/no-unnecessary-condition": "error",
                        "@typescript-eslint/prefer-as-const": "error",
                        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
                        "@typescript-eslint/prefer-for-of": "error",
                        "@typescript-eslint/prefer-includes": "error",
                        "@typescript-eslint/prefer-nullish-coalescing": "error",
                        "@typescript-eslint/prefer-optional-chain": "error",
                        "@typescript-eslint/restrict-plus-operands": "error",
                        "@typescript-eslint/restrict-template-expressions": "off",
                        "@typescript-eslint/no-use-before-define": [
                            "error",
                            { functions: false, typedefs: false, classes: false },
                        ],
                    },
                },
                {
                    files: ["*.js"],
                    parserOptions: {
                        ecmaVersion: "latest",
                    },
                    env: {
                        es6: true,
                    },
                },
                {
                    files: ["*.spec.{ts,tsx}"],
                    rules: {
                        "@typescript-eslint/no-non-null-assertion": "off",
                        "@typescript-eslint/no-empty-function": "off",
                        "@typescript-eslint/parameter-properties": "off",
                    },
                },
            ],
        };
    },
};
