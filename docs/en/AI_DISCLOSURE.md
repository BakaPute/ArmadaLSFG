# AI Development Disclosure

## Purpose

This document explains the role of artificial intelligence in the development of Armada LSFG.

The goal is transparency about the origin of the code and the real development process.

Armada LSFG is not presented as software that was entirely handwritten by the repository owner.

---

## AI system used

OpenAI ChatGPT was used extensively throughout development.

ChatGPT generated or assisted with:

- Python backend code;
- TypeScript/React frontend code;
- Decky integration;
- configuration parsing;
- profile management;
- Steam manifest parsing;
- executable detection;
- UI logic;
- error handling;
- debugging procedures;
- shell commands used during development;
- cleanup and refactoring;
- documentation.

---

## Human involvement

BakaPute remains the project owner and maintainer.

Human involvement includes:

- original project idea;
- requirement definition;
- feature selection;
- expected behavior decisions;
- real-hardware testing;
- build deployment;
- command execution;
- runtime validation;
- log collection;
- reporting failures and regressions;
- accepting or rejecting proposed solutions;
- publication and maintenance.

ChatGPT did not directly control the target hardware and could not independently verify runtime behavior.

---

## Development process

Development used an iterative human-in-the-loop workflow:

1. BakaPute describes a requirement;
2. ChatGPT proposes or generates code;
3. the code is compiled in a Linux VM;
4. Python backend syntax is validated;
5. the TypeScript frontend is built;
6. files are deployed to the ArmadaOS device;
7. BakaPute tests real behavior;
8. logs and configuration files are inspected;
9. problems are reported back to ChatGPT;
10. a fix is generated;
11. the cycle repeats until behavior is validated.

---

## What should not be considered AI-created code

Armada LSFG was initialized from the Decky Plugin Template.

Files, structures, concepts, dependencies, and other material originating from third-party projects retain their original origin and attribution.

See `THIRD_PARTY_NOTICES.md`.

---

## Limitations

AI-generated code can contain:

- bugs;
- incorrect assumptions;
- insecure behavior;
- inefficiencies;
- compatibility problems;
- misleading comments;
- incomplete error handling.

The presence of AI in the development process must never be considered a guarantee of quality or security.

Users and contributors are encouraged to review the code and verify changes themselves before relying on them.

---

## Why disclose this?

Armada LSFG exists because of a combination of:

- existing open-source projects;
- human experimentation;
- real-hardware testing;
- AI-assisted software development.

Hiding any of those parts would provide an incomplete picture of how the project was created.

---

## Attribution statement

BakaPute is the project owner and maintainer.

Project-specific Armada LSFG implementation was developed substantially with OpenAI ChatGPT based on BakaPute's requirements, decisions, testing, diagnostics, and feedback.

Third-party material remains attributed to its original authors.
