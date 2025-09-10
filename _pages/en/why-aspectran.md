---
format: plate solid article
sidebar: right
title: "Why Aspectran"
teaser: '"Design for Sustainable Simplicity: The Aspectran Architectural Philosophy"'
header:
  image_fullwidth: "aspectran-world.jpg"
  caption: "Aspectran World"
---

## Introduction

Software frameworks tend to grow more complex over time as they expand in functionality and maintain backward compatibility. This increase in complexity can steepen the learning curve, make maintenance difficult, and ultimately hinder the productivity that frameworks are meant to provide.

Aspectran was designed as an answer to the question: **"Can richness of functionality and simplicity of design coexist?"** It aims to provide a lightweight, intuitive, yet powerful architecture, especially as an alternative to large and complex frameworks like Spring. This document explains the core design principles and architectural philosophy that have allowed Aspectran to maintain its value of "sustainable simplicity" as it has evolved.

This philosophy is deeply embedded in the name of the framework itself. When development first began in March 2008, the project's initial name was **'Translets'**. This was a portmanteau of 'Transformation Servlet', signifying an early vision focused on the core function of receiving user requests, transforming them, and generating responses.

Later in the development process, as AOP (Aspect-Oriented Programming) was integrated as a core concept, the project was renamed around July 2012 to reflect its new identity: **Aspectran**.

![Aspect + Tran(slet) = Aspectran](/images/docs/aspect_tran.svg)

The change was more than just a new name; it symbolized the framework's evolutionary direction. It aimed to achieve both **structural simplicity and functional modularity** by adding the powerful cross-cutting concern separation of 'Aspect' on top of the clear request-processing structure represented by 'Translet'.

Since its first release on September 1, 2015, Aspectran has evolved based on this core philosophy. We will now explore the specific design principles that have enabled Aspectran to maintain its simplicity, such as how it uses DTD to simplify configuration, controls complexity through an internal 'Rule' model, and maintains clarity through a clear separation of roles.

## The First Step Towards Simplicity: A Pragmatic Choice

One of the earliest decisions that best illustrates Aspectran's design philosophy was the adoption of DTD (Document Type Definition) instead of XML Schema (XSD) for validating XML configurations. While XSD is technically more powerful, offering features like data typing and namespace support, Aspectran intentionally chose the simpler DTD. This was not because DTD is superior, but because it was **sufficient and suitable** for Aspectran's goals.

-   **Focus on 'Structure', Validation by the 'Framework'**: The core purpose of Aspectran's configuration is to define the structural relationships between elements like `<bean>`, `<translet>`, and `<aspect>`, not the validity of data types. DTD is perfectly adequate for validating this structural integrity. A pragmatic decision was made that detailed data validation—such as checking if a class name exists or if an attribute value is a valid number—is more efficiently and consistently handled by the framework's Java code at the point of parsing the configuration into rule objects.

-   **Exclusion of Unnecessary Complexity**: Aspectran's configuration does not need to be mixed with other XML vocabularies, making XSD's primary advantage, namespace support, unnecessary. The framework deliberately avoided technical complexity that was not essential to its core purpose.

Thus, Aspectran began to secure its simplicity through a pragmatic approach, choosing the simplest solution that fit the problem rather than striving for technical superiority for its own sake.

## The Core of Sustainable Simplicity: The Consistent Internal 'Rule' Model

The most critical secret to how Aspectran has maintained its simplicity over time lies in its **consistent internal configuration model: the 'Rule' objects**.

External configuration files (in XML or APON) are merely the interface for users to define the framework's behavior; Aspectran does not use them directly. Instead, it parses any configuration format into a standardized set of 'Rule' objects, such as `BeanRule`, `TransletRule`, and `AspectRule`, defined in the `com.aspectran.core.context.rule` package.

This architecture provides powerful advantages:

1.  **Isolation of Complexity**: Changes to the external interface, such as the complexity of XML parsing or the addition of new configuration attributes, do not directly impact the framework's core execution logic. All changes are absorbed and standardized at the abstraction layer of the 'Rule' model.

2.  **Flexibility in Configuration Methods**: This design is what allowed Aspectran to later add APON (Aspectran Parameter Object Notation), a new JSON-like configuration format. The APON parser simply needed to produce the same 'Rule' objects as the XML parser, requiring no changes to the framework's other code.

3.  **Clear Division of Roles**: The framework only needs to deal with the well-defined data structure of the 'Rule' objects, making its logic much simpler and clearer. The "how to read" (Parsing) is completely decoupled from the "how to execute" (Runtime).

Ultimately, the key technique that enabled Aspectran to achieve sustainable simplicity is the control of external complexity by **transforming it into a simple and consistent internal model of 'Rules'**.

## Principles that Guard Simplicity

In addition to the 'Rule' model, Aspectran maintains simplicity through the following design principles:

### Clear Separation of Concerns

Aspectran's core concepts have clearly defined roles and do not overstep their responsibilities.

-   **Translet**: Focuses solely on a single Unit of Work: receiving a request, controlling the processing flow, and generating a final response.
-   **Bean**: Focuses only on the definition and lifecycle management of stateful, reusable components (objects).
-   **Aspect**: Focuses exclusively on modularizing cross-cutting concerns, such as transactions, logging, and security, that apply to various business logic components.

Each element is intentionally designed to not take on too many responsibilities. For example, a `Translet` delegates logic to a `Bean` via an `Action` instead of accessing a database directly. This structure clarifies the role of each element and makes the overall design simple and predictable.

### Intentional Feature Limitation

Complexity grows exponentially when a framework tries to be a silver bullet for every situation. While Aspectran embraces some modern trends like 'Convention over Configuration', it defaults to explicit and intuitive configuration. It also deliberately limits features that deviate from its core.

-   **Simple Expression Language (AsEL)**: Instead of a highly complex, programmable expression language like Spring's SpEL, Aspectran provides a simple EL with only essential features, such as bean references (`#{...}`) and property references (`%{...}`). This reduces configuration complexity and increases predictability.

## Conclusion

Aspectran's simplicity is not an accident but **the product of intentional design, born from a critical perspective on 'frameworks that grow complex' and aimed at achieving 'sustainable simplicity'**. The combination of pragmatic technology choices, the isolation of complexity through a powerful internal 'Rule' model, and the principles of clear role separation and careful feature limitation has forged Aspectran's lightweight and powerful architecture. Through this, Aspectran provides developers with high productivity and maintainability, laying a solid foundation for flexibly adapting to change.
