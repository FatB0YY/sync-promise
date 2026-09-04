**English** | [Русский](./README.ru.md)

# Sync Promise

An experimental synchronous Promise-like implementation written in JavaScript.

This project explores what a Promise-like abstraction could look like if it preserved the familiar `then`, `catch`, and `finally` API, but executed handlers synchronously instead of scheduling them through the microtask queue.

The goal of this repository is not to replace the native JavaScript `Promise`. The goal is to study how promise resolution, chaining, error propagation, thenable assimilation, and state transitions work internally.

## Motivation

This repository focuses on a lower-level JavaScript concept instead.

`SyncPromise` is a small implementation of a Promise-like object that helps demonstrate:

* how promise states are represented internally;
* how `then` chains are built;
* how returned values are passed through the chain;
* how thrown errors become rejections;
* how rejection recovery works;
* how thenable objects are resolved;
* why self-resolution must be rejected;
* how `catch` and `finally` can be implemented on top of `then`;
* how synchronous execution differs from native Promise microtask scheduling.

## Core Idea

Native JavaScript promises always execute `.then()` handlers asynchronously through the microtask queue.

Example with native `Promise`:

```js
Promise.resolve(1).then(() => {
  console.log("promise");
});

console.log("after");
```

Output:

```txt
after
promise
```

`SyncPromise` executes handlers immediately when the value is already available:

```js
new SyncPromise((resolve) => {
  resolve(1);
}).then(() => {
  console.log("sync promise");
});

console.log("after");
```

Output:

```txt
sync promise
after
```

This difference is intentional. `SyncPromise` is designed to behave like a Promise-like abstraction without creating microtasks by itself.

## Features

* Synchronous handler execution
* `then(onFulfilled, onRejected)`
* `catch(onRejected)`
* `finally(onFinally)`
* Chaining support
* Error propagation
* Rejection recovery
* Thenable resolution
* Protection against multiple thenable calls
* Protection against self-resolution
* No external dependencies
* Simple test runner included

## State Model

Internally, `SyncPromise` uses a small state machine:

```txt
0   pending
1   resolving through thenable
2   fulfilled
-1  rejected
```

Basic flow:

```txt
pending
  |
  | resolve(value)
  v
fulfilled

pending
  |
  | reject(reason)
  v
rejected

pending
  |
  | resolve(thenable)
  v
resolving
  |
  | thenable resolves
  v
fulfilled

resolving
  |
  | thenable rejects
  v
rejected
```

## Example

```js
const promise = new SyncPromise((resolve) => {
  resolve(10);
});

promise
  .then((value) => value + 5)
  .then((value) => value * 2)
  .then((value) => {
    console.log(value);
  });
```

Output:

```txt
30
```

## Error Handling

Thrown errors are converted into rejections:

```js
new SyncPromise((resolve) => {
  resolve(10);
})
  .then(() => {
    throw new Error("Something went wrong");
  })
  .catch((error) => {
    console.log(error.message);
  });
```

Output:

```txt
Something went wrong
```

## Thenable Resolution

`SyncPromise` can resolve thenable objects:

```js
const thenable = {
  then(resolve) {
    resolve("resolved from thenable");
  },
};

new SyncPromise((resolve) => {
  resolve(thenable);
}).then((value) => {
  console.log(value);
});
```

Output:

```txt
resolved from thenable
```

It also protects against incorrectly implemented thenables that call both callbacks:

```js
const badThenable = {
  then(resolve, reject) {
    resolve("ok");
    reject("error");
  },
};

new SyncPromise((resolve) => {
  resolve(badThenable);
}).then(
  (value) => console.log(value),
  (reason) => console.log(reason)
);
```

Output:

```txt
ok
```

The first call wins, just like with native Promise resolution.

## Self-Resolution Protection

A promise-like object must not resolve itself.

```js
let resolve;

const promise = new SyncPromise((r) => {
  resolve = r;
});

resolve(promise);
```

This results in a rejection with `TypeError`.

## Difference from Native Promise

`SyncPromise` is not a drop-in replacement for native `Promise`.

Key differences:

* native `Promise` schedules `.then()` handlers as microtasks;
* `SyncPromise` executes handlers synchronously;
* native `Promise` is part of the JavaScript specification;
* `SyncPromise` is an educational and experimental implementation;
* native `Promise` has static methods such as `Promise.resolve`, `Promise.reject`, `Promise.all`, and others;
* `SyncPromise` currently focuses on instance-level behavior: `then`, `catch`, and `finally`.

## Why This Project Exists

This project is useful for studying JavaScript internals beyond common application-level code.

It demonstrates that promises are not only about asynchronous operations. They are also about:

* state transitions;
* callback queues;
* value propagation;
* error propagation;
* chain composition;
* thenable assimilation;
* API design.

Understanding these concepts helps build a deeper mental model of JavaScript runtime behavior.

## Running Tests

The project uses a minimal custom test runner and does not require any testing libraries.

## Notes

This project intentionally avoids using external dependencies. The implementation is small enough to be read and understood directly.

The main purpose of the repository is to demonstrate low-level JavaScript knowledge, not to provide a production replacement for the native `Promise` implementation.
