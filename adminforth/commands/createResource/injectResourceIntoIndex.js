import fs from "fs/promises";
import path from "path";
import { parse } from "@babel/parser";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";

const parser = {
  parse(source) {
    return parse(source, {
      sourceType: "module",
      plugins: ["typescript"],
    });
  },
};

export async function injectResourceIntoIndex({
  indexFilePath = path.resolve(process.cwd(), "index.ts"),
  table,
  resourceId,
  label,
  icon = "flowbite:user-solid",
}) {
  let code = await fs.readFile(indexFilePath, "utf-8");
  const ast = recast.parse(code, { parser });

  const importLine = `import ${resourceId}Resource from "./resources/${table}";`;
  let alreadyImported = false;

  recast.visit(ast, {
    visitImportDeclaration(path) {
      const { node } = path;
      if (
        n.ImportDeclaration.check(node) &&
        node.source.value === `./resources/${table}`
      ) {
        alreadyImported = true;
        return false;
      }
      this.traverse(path);
    },
  });

  if (alreadyImported) {
    console.warn(`⚠️ Resource already imported: ${table}`);
    return;
  }

  // Add import at top
  ast.program.body.unshift(
    b.importDeclaration(
      [b.importDefaultSpecifier(b.identifier(`${resourceId}Resource`))],
      b.stringLiteral(`./resources/${table}`)
    )
  );

  // Find config object with `resources` and `menu`
  recast.visit(ast, {
    visitObjectExpression(path) {
      const node = path.node;

      const resourcesProp = node.properties.find(
        (p) =>
          n.ObjectProperty.check(p) &&
          n.Identifier.check(p.key) &&
          p.key.name === "resources" &&
          n.ArrayExpression.check(p.value)
      );

      if (resourcesProp) {
        const arr = resourcesProp.value.elements;
        const alreadyExists = arr.some(
          (el) =>
            n.Identifier.check(el) &&
            el.name === `${resourceId}Resource`
        );
        if (!alreadyExists) {
          arr.push(b.identifier(`${resourceId}Resource`));
        }
      }

      const menuProp = node.properties.find(
        (p) =>
          n.ObjectProperty.check(p) &&
          n.Identifier.check(p.key) &&
          p.key.name === "menu" &&
          n.ArrayExpression.check(p.value)
      );

      if (menuProp) {
        const newItem = b.objectExpression([
          b.objectProperty(b.identifier("label"), b.stringLiteral(capitalizeWords(label))),
          b.objectProperty(b.identifier("icon"), b.stringLiteral(icon)),
          b.objectProperty(b.identifier("resourceId"), b.stringLiteral(resourceId)),
        ]);

        menuProp.value.elements.push(newItem);
      }

      return false; // Done
    },
  });

  const newCode = recast.print(ast).code;
  await fs.writeFile(indexFilePath, newCode, "utf-8");
  console.log(`✅ Injected resource "${resourceId}" into index`);
}

function capitalizeWords(str) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
