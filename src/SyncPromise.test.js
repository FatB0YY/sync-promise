import { SyncPromise } from "./SyncPromise.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(error.message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected: ${expected}, actual: ${actual}`);
  }
}
test("then: fulfilled value", () => {
  const p = new SyncPromise((resolve) => resolve(10));

  let result;

  p.then((value) => {
    result = value;
  });

  assertEqual(result, 10, "then should receive fulfilled value");
});

test("then: rejected reason", () => {
  const p = new SyncPromise((resolve, reject) => reject("error"));

  let result;

  p.then(null, (reason) => {
    result = reason;
  });

  assertEqual(result, "error", "then should receive rejected reason");
});

test("catch: handles rejection", () => {
  const p = new SyncPromise((resolve, reject) => reject("error"));

  let result;

  p.catch((reason) => {
    result = reason;
  });

  assertEqual(result, "error", "catch should handle rejection");
});

test("then: chaining works", () => {
  const p = new SyncPromise((resolve) => resolve(10));

  let result;

  p.then((value) => value + 5)
    .then((value) => value * 2)
    .then((value) => {
      result = value;
    });

  assertEqual(result, 30, "then chain should transform value");
});

test("then: thrown error becomes rejection", () => {
  const p = new SyncPromise((resolve) => resolve(10));

  let result;

  p.then(() => {
    throw new Error("boom");
  }).catch((error) => {
    result = error.message;
  });

  assertEqual(result, "boom", "thrown error should become rejection");
});

test("finally: runs after fulfilled and keeps value", () => {
  const p = new SyncPromise((resolve) => resolve(10));

  let finallyCalled = false;
  let result;

  p.finally(() => {
    finallyCalled = true;
  }).then((value) => {
    result = value;
  });

  assertEqual(finallyCalled, true, "finally should be called");
  assertEqual(result, 10, "finally should keep fulfilled value");
});

test("finally: runs after rejected and keeps reason", () => {
  const p = new SyncPromise((resolve, reject) => reject("error"));

  let finallyCalled = false;
  let result;

  p.finally(() => {
    finallyCalled = true;
  }).catch((reason) => {
    result = reason;
  });

  assertEqual(finallyCalled, true, "finally should be called");
  assertEqual(result, "error", "finally should keep rejection reason");
});

test("finally: thrown error replaces fulfilled value", () => {
  const p = new SyncPromise((resolve) => resolve(10));

  let result;

  p.finally(() => {
    throw new Error("finally error");
  }).catch((error) => {
    result = error.message;
  });

  assertEqual(result, "finally error", "finally error should replace value");
});

test("finally: thrown error replaces rejection reason", () => {
  const p = new SyncPromise((resolve, reject) => reject("original error"));

  let result;

  p.finally(() => {
    throw new Error("finally error");
  }).catch((error) => {
    result = error.message;
  });

  assertEqual(
    result,
    "finally error",
    "finally error should replace original reason",
  );
});

test("finally: returned fulfilled SyncPromise keeps original value", () => {
  const p = new SyncPromise((resolve) => resolve(10));

  let result;

  p.finally(() => {
    return new SyncPromise((resolve) => resolve("ignored"));
  }).then((value) => {
    result = value;
  });

  assertEqual(result, 10, "fulfilled finally promise should not replace value");
});

test("finally: returned rejected SyncPromise replaces value", () => {
  const p = new SyncPromise((resolve) => resolve(10));

  let result;

  p.finally(() => {
    return new SyncPromise((resolve, reject) => reject("finally rejection"));
  }).catch((reason) => {
    result = reason;
  });

  assertEqual(
    result,
    "finally rejection",
    "rejected finally promise should replace value",
  );
});

test("thenable: resolve wins over later reject", () => {
  const badThenable = {
    then(resolve, reject) {
      resolve("ok");
      reject("error");
    },
  };

  const p = new SyncPromise((resolve) => resolve(badThenable));

  let result;

  p.then(
    (value) => {
      result = `fulfilled: ${value}`;
    },
    (reason) => {
      result = `rejected: ${reason}`;
    },
  );

  assertEqual(result, "fulfilled: ok", "first thenable call should win");
});

test("thenable: reject wins over later resolve", () => {
  const badThenable = {
    then(resolve, reject) {
      reject("error");
      resolve("ok");
    },
  };

  const p = new SyncPromise((resolve) => resolve(badThenable));

  let result;

  p.then(
    (value) => {
      result = `fulfilled: ${value}`;
    },
    (reason) => {
      result = `rejected: ${reason}`;
    },
  );

  assertEqual(result, "rejected: error", "first thenable call should win");
});

test("self-resolution: promise cannot resolve itself", () => {
  let resolve;

  const p = new SyncPromise((r) => {
    resolve = r;
  });

  let result;

  resolve(p);

  p.catch((error) => {
    result = error instanceof TypeError;
  });

  assertEqual(result, true, "self-resolution should reject with TypeError");
});

test("thenable: throwing then should reject", () => {
  const badThenable = {
    then() {
      throw new Error("boom");
    },
  };

  const p = new SyncPromise((resolve) => resolve(badThenable));

  let result;

  p.catch((error) => {
    result = error.message;
  });

  assertEqual(result, "boom", "throwing then should reject");
});
