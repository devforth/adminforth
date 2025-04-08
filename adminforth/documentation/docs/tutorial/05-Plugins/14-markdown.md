# Markdown

The Markdown plugin enables Markdown support in AdminForth, allowing users to create and edit records using Markdown syntax.

## Installation

To install the plugin:

```bash
npm install @adminforth/markdown --save
```

### Usage

Configure the plugin in your apartments resource file:

```typescript title="./resources/apartments.ts"
import MarkdownPlugin from '@adminforth/markdown';

// ... existing resource configuration ...

plugins: [
  new MarkdownPlugin({fieldName: "description"}),
]
```

Here is how it looks in create view:

![alt text](markdown.png)

Here is how it looks in show view:

![alt text](markdown-show1.png)
![alt text](markdown-show2.png)

