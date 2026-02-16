---
format: plate solid article
title: "Introduction to APON.js"
teaser: APON.js is a lightweight, zero-dependency library that allows you to handle the APON(Aspectran Parameters Object Notation) format natively in a JavaScript environment.
sidebar: toc
---

APON.js brings the convenience and readability of APON (Aspectran Parameters Object Notation), originally created for the Aspectran framework, to the JavaScript world.

## What is APON.js?

APON.js is a lightweight, zero-dependency library that allows you to handle the APON format natively in a JavaScript environment. Now, you can parse and create APON strings as naturally as you would use `JSON.parse()` or `JSON.stringify()` in your web browser or Node.js projects.

## ✨ Key Features

*   **`APON.parse(text)`**: A powerful parser that converts APON-formatted strings into standard JavaScript objects. It correctly handles nested objects, arrays, comments, multi-line text blocks, and various data types.
*   **`APON.stringify(object)`**: A flexible stringifier that converts JavaScript objects into clean, human-readable APON strings. It automatically handles indentation and quoting for you.
*   **Zero-Dependency**: Written in pure JavaScript (ES6) without any external libraries, ensuring a small footprint and no extra baggage for your project.
*   **Broad Environment Support**: Works flawlessly in all modern web browsers and Node.js environments.

## 🚀 Getting Started

You can install `apon.js` right now via npm.

```bash
npm install apon
```

### Basic Usage

```javascript
const APON = require('apon');

// 1. Parse an APON string
const aponText = `
  # Application Configuration
  appName: APON.js Demo
  version: 1.0.0
  debugMode: true
`;
const config = APON.parse(aponText);

console.log(config.appName); // "APON.js Demo"

// 2. Stringify a JavaScript object
const dbConfig = {
  database: {
    host: "localhost",
    port: 5432,
    users: ["admin", "readonly"]
  }
};
const newAponText = APON.stringify(dbConfig);

console.log(newAponText);
/*
database: {
  host: localhost
  port: 5432
  users: [
    admin
    readonly
  ]
}
*/
```

## 🌐 Live Demo

Seeing is believing. You can test out all the features of `apon.js` right now with our interactive demo.

**[Try the APON.js Interactive Demo Now!](https://aspectran.github.io/apon.js/)**

---

* **GitHub Repository**: [https://github.com/aspectran/apon.js](https://github.com/aspectran/apon.js)
