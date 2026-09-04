[English](./README.md) | **Русский**

# Sync Promise

Экспериментальная синхронная реализация Promise-подобного объекта на JavaScript.

Проект исследует, как могла бы выглядеть Promise-подобная абстракция, сохраняющая привычный API `then`, `catch` и `finally`, но выполняющая обработчики синхронно, а не через очередь микрозадач.

Цель репозитория не в том, чтобы заменить нативный `Promise`. Цель — разобраться, как внутри устроены разрешение промиса, построение цепочек, распространение ошибок, поглощение thenable-объектов и переходы между состояниями.

## Мотивация

`SyncPromise` — небольшая реализация Promise-подобного объекта, которая наглядно показывает:

- как внутренне представлены состояния промиса;
- как строятся цепочки `then`;
- как возвращаемые значения передаются по цепочке;
- как выброшенные ошибки превращаются в rejection;
- как работает восстановление после rejection;
- как разрешаются thenable-объекты;
- почему саморазрешение должно приводить к ошибке;
- как `catch` и `finally` реализуются поверх `then`;
- чем синхронное выполнение отличается от планирования микрозадач у нативного Promise.

## Основная идея

Нативные промисы всегда выполняют обработчики `.then()` асинхронно, через очередь микрозадач.

Пример с нативным `Promise`:

```js
Promise.resolve(1).then(() => {
  console.log("promise");
});

console.log("after");
```

Вывод:

```
after
promise
```

`SyncPromise` выполняет обработчики немедленно, если значение уже доступно:

```js
new SyncPromise((resolve) => {
  resolve(1);
}).then(() => {
  console.log("sync promise");
});

console.log("after");
```

Вывод:

```
sync promise
after
```

Это различие сделано намеренно. `SyncPromise` спроектирован как Promise-подобная абстракция, которая сама по себе не создаёт микрозадач.

## Возможности

- Синхронное выполнение обработчиков
- `then(onFulfilled, onRejected)`
- `catch(onRejected)`
- `finally(onFinally)`
- Поддержка цепочек
- Распространение ошибок
- Восстановление после rejection
- Разрешение thenable-объектов
- Защита от повторных вызовов thenable
- Защита от саморазрешения
- Отсутствие внешних зависимостей
- Встроенный минимальный тест-раннер

## Модель состояний

Внутри `SyncPromise` использует небольшой конечный автомат:

```
0   pending
1   resolving through thenable
2   fulfilled
-1  rejected
```

Основные переходы:

```
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

## Пример

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

Вывод:

```
30
```

## Обработка ошибок

Выброшенные ошибки превращаются в rejection:

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

Вывод:

```
Something went wrong
```

## Разрешение thenable

`SyncPromise` умеет разрешать thenable-объекты:

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

Вывод:

```
resolved from thenable
```

Реализация также защищена от некорректных thenable, вызывающих оба колбэка:

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

Вывод:

```
ok
```

Побеждает первый вызов — ровно как при разрешении нативного Promise.

## Защита от саморазрешения

Promise-подобный объект не должен разрешать сам себя.

```js
let resolve;

const promise = new SyncPromise((r) => {
  resolve = r;
});

resolve(promise);
```

Это приводит к rejection с `TypeError`.

## Отличия от нативного Promise

`SyncPromise` не является заменой нативного `Promise`.

Ключевые отличия:

- нативный `Promise` планирует обработчики `.then()` как микрозадачи;
- `SyncPromise` выполняет обработчики синхронно;
- нативный `Promise` описан в спецификации языка;
- `SyncPromise` — учебная и экспериментальная реализация;
- у нативного `Promise` есть статические методы `Promise.resolve`, `Promise.reject`, `Promise.all` и другие;
- `SyncPromise` пока охватывает поведение на уровне экземпляра: `then`, `catch` и `finally`.

## Зачем этот проект

Проект полезен для изучения внутреннего устройства JavaScript за пределами прикладного кода.

Он показывает, что промисы — это не только про асинхронность. Это ещё и про:

- переходы между состояниями;
- очереди колбэков;
- передачу значений;
- распространение ошибок;
- композицию цепочек;
- поглощение thenable-объектов;
- проектирование API.

Понимание этих вещей формирует более глубокую модель работы среды выполнения JavaScript.

## Запуск тестов

В проекте используется минимальный собственный тест-раннер, никаких библиотек для тестирования не требуется.

## Примечания

Проект намеренно обходится без внешних зависимостей. Реализация достаточно компактна, чтобы её можно было прочитать и понять целиком.

Основная задача репозитория — продемонстрировать низкоуровневое понимание JavaScript, а не предложить продакшн-замену нативному `Promise`.

## Лицензия

MIT.

## Автор

Родион Рамазанов — [GitHub](https://github.com/FatB0YY) · [Telegram](https://t.me/iamrodionn)
