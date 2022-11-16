---
title: redux
description: A simple, lightweight react-redux alternative, written in TypeScript.
keywords:
  - react
  - redux
  - hooks
sidebar:
  - 'setup'
  - 'provider'
  - 'hooks'
---

# @react-nano/redux

[![License](https://flat.badgen.net/github/license/lusito/react-nano?icon=github)](https://github.com/Lusito/react-nano/blob/master/LICENSE)
[![Minified + gzipped size](https://flat.badgen.net/bundlephobia/minzip/@react-nano/redux?icon=dockbit)](https://bundlephobia.com/result?p=@react-nano/redux)
[![NPM version](https://flat.badgen.net/npm/v/@react-nano/redux?icon=npm)](https://www.npmjs.com/package/@react-nano/redux)
[![Stars](https://flat.badgen.net/github/stars/lusito/react-nano?icon=github)](https://github.com/lusito/react-nano)
[![Watchers](https://flat.badgen.net/github/watchers/lusito/react-nano?icon=github)](https://github.com/lusito/react-nano)

A simple, lightweight react-redux alternative, written in TypeScript.

## Overview

- All hooks are compatible to react-redux
- Only has two peer dependencies:
  - React 16.8.0 or higher
  - Redux 4.0.0 or higher
- Using hooks to access redux in react is soo much cleaner than using react-redux's `connect` higher order component.

## Migrating From react-redux

This library defines a different provider, which works the same way, but it does not provide the redux store to `react-redux`.
So using the original hooks and connect functions from `react-redux` won't work.

That is easily fixed though: If you want to gradually move code from `react-redux` to `@react-nano/redux`, simply add one `Provider` for each library:
```tsx
import { Provider } from "@react-nano/redux";
import { Provider as LegacyProvider } from "react-redux";
export const App = () => (
    <Provider store={store}>
        <LegacyProvider store={store}>
            ...your app content...
        </LegacyProvider>
    </Provider>
);
```

Now all you need to do is migrate your components to use hooks instead of `connect()`. If you are already using hooks, then it's just a matter of replacing the import from react-redux to @react-nano/redux!
