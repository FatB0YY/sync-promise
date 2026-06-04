export class SyncPromise {
  #state = 0;
  #value;
  #reason;

  #onFulfilled = [];
  #onRejected = [];

  #clearHandlers() {
    this.#onFulfilled.splice(0, this.#onFulfilled.length);
    this.#onRejected.splice(0, this.#onRejected.length);
  }

  constructor(executor) {
    const resolver = (value) => {
      if (value === this) {
        rejecter(new TypeError("SyncPromise cannot resolve itself"));
        return;
      }

      this.#value = value;

      if (value != null && typeof value.then === "function") {
        this.#state = 1;

        let wasCalled = false;

        try {
          value.then(
            (fulfilledValue) => {
              if (wasCalled) return;

              wasCalled = true;
              resolver(fulfilledValue);
            },
            (rejectedReason) => {
              if (wasCalled) return;

              wasCalled = true;
              rejecter(rejectedReason);
            },
          );
        } catch (error) {
          if (wasCalled) return;

          wasCalled = true;
          rejecter(error);
        }
      } else {
        this.#state = 2;
        this.#value = value;

        const handlers = this.#onFulfilled.splice(0, this.#onFulfilled.length);
        this.#clearHandlers();

        handlers.forEach((handler) => handler(this.#value));
      }
    };

    const resolve = (value) => {
      if (this.#state === 0) {
        resolver(value);
      }
    };

    const rejecter = (reason) => {
      this.#state = -1;
      this.#reason = reason;

      const handlers = this.#onRejected.splice(0, this.#onRejected.length);
      this.#clearHandlers();

      handlers.forEach((handler) => handler(this.#reason));
    };

    const reject = (reason) => {
      if (this.#state === 0) {
        rejecter(reason);
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new SyncPromise((resolve, reject) => {
      const resolver = (value) => {
        try {
          if (typeof onFulfilled === "function") {
            resolve(onFulfilled(value));
          } else {
            resolve(value);
          }
        } catch (error) {
          reject(error);
        }
      };

      const rejecter = (reason) => {
        try {
          if (typeof onRejected === "function") {
            resolve(onRejected(reason));
          } else {
            reject(reason);
          }
        } catch (error) {
          reject(error);
        }
      };

      switch (this.#state) {
        case -1:
          rejecter(this.#reason);
          break;

        case 2:
          resolver(this.#value);
          break;

        default:
          this.#onFulfilled.push(resolver);
          this.#onRejected.push(rejecter);
          break;
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      (value) => {
        if (typeof onFinally !== "function") {
          return value;
        }

        return new SyncPromise((resolve) => {
          resolve(onFinally());
        }).then(() => value);
      },
      (reason) => {
        if (typeof onFinally !== "function") {
          throw reason;
        }

        return new SyncPromise((resolve) => {
          resolve(onFinally());
        }).then(() => {
          throw reason;
        });
      },
    );
  }
}
