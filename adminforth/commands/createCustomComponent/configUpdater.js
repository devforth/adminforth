import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import recast from 'recast'; // Import recast
import * as typescriptParser from 'recast/parsers/typescript.js'; // Import the parser using ESM and include the .js extension

const b = recast.types.builders; // Like t.* in babel/types
const n = recast.types.namedTypes; // Like t.is* in babel/types

// Helper: find the line number of components[fieldType] inside columns[name===columnName]
function findComponentPropLine(ast, columnName, fieldType) {
  let line = null;
  recast.visit(ast, {
    visitExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      let objectExpressionNode = null;

      if (n.TSAsExpression.check(declaration) && n.ObjectExpression.check(declaration.expression)) {
        objectExpressionNode = declaration.expression;
      } else if (n.ObjectExpression.check(declaration)) {
        objectExpressionNode = declaration;
      } else if (n.Identifier.check(declaration)) {
        const varName = declaration.name;
        recast.visit(ast, {
          visitVariableDeclaration(path2) {
            for (const decl of path2.node.declarations) {
              if (
                n.VariableDeclarator.check(decl) &&
                n.Identifier.check(decl.id) &&
                decl.id.name === varName &&
                n.ObjectExpression.check(decl.init)
              ) {
                objectExpressionNode = decl.init;
                return false;
              }
            }
            this.traverse(path2);
          }
        });
      }

      if (!objectExpressionNode) return false;

      const isKey = (keyNode, name) => (n.Identifier.check(keyNode) && keyNode.name === name) || (n.StringLiteral.check(keyNode) && keyNode.value === name);

      const columnsProperty = objectExpressionNode.properties.find(prop =>
        n.ObjectProperty.check(prop) && isKey(prop.key, 'columns')
      );
      if (!columnsProperty || !n.ArrayExpression.check(columnsProperty.value)) return false;

      const columnsArray = columnsProperty.value.elements;
      const targetColumn = columnsArray.find(col => {
        if (n.ObjectExpression.check(col)) {
          const nameProp = col.properties.find(p =>
            n.ObjectProperty.check(p) && isKey(p.key, 'name') &&
            n.StringLiteral.check(p.value) && p.value.value === columnName
          );
          return !!nameProp;
        }
        return false;
      });
      if (!targetColumn || !n.ObjectExpression.check(targetColumn)) return false;

      const componentsProperty = targetColumn.properties.find(p =>
        n.ObjectProperty.check(p) && isKey(p.key, 'components')
      );
      if (!componentsProperty || !n.ObjectExpression.check(componentsProperty.value)) return false;

      const fieldTypeProperty = componentsProperty.value.properties.find(p =>
        n.ObjectProperty.check(p) && isKey(p.key, fieldType)
      );
      if (fieldTypeProperty && fieldTypeProperty.loc) {
        line = fieldTypeProperty.loc.start.line;
        this.abort();
      }
      return false;
    }
  });
  return line;
}

// New Helper: find the line number of the 'components' property inside the target column
function findComponentsPropLine(ast, columnName) {
  let line = null;
  recast.visit(ast, {
    visitExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      let objectExpressionNode = null;

      if (n.TSAsExpression.check(declaration) && n.ObjectExpression.check(declaration.expression)) {
        objectExpressionNode = declaration.expression;
      } else if (n.ObjectExpression.check(declaration)) {
        objectExpressionNode = declaration;
      } else if (n.Identifier.check(declaration)) {
        const varName = declaration.name;
        recast.visit(ast, {
          visitVariableDeclaration(path2) {
            for (const decl of path2.node.declarations) {
              if (
                n.VariableDeclarator.check(decl) &&
                n.Identifier.check(decl.id) &&
                decl.id.name === varName &&
                n.ObjectExpression.check(decl.init)
              ) {
                objectExpressionNode = decl.init;
                return false;
              }
            }
            this.traverse(path2);
          }
        });
      }

      if (!objectExpressionNode) return false;
      const isKey = (keyNode, name) => (n.Identifier.check(keyNode) && keyNode.name === name) || (n.StringLiteral.check(keyNode) && keyNode.value === name);

      const columnsProperty = objectExpressionNode.properties.find(prop =>
        n.ObjectProperty.check(prop) && isKey(prop.key, 'columns')
      );
      if (!columnsProperty || !n.ArrayExpression.check(columnsProperty.value)) return false;

      const columnsArray = columnsProperty.value.elements;
      const targetColumn = columnsArray.find(col => {
        if (n.ObjectExpression.check(col)) {
          const nameProp = col.properties.find(p =>
            n.ObjectProperty.check(p) && isKey(p.key, 'name') &&
            n.StringLiteral.check(p.value) && p.value.value === columnName
          );
          return !!nameProp;
        }
        return false;
      });
      if (!targetColumn || !n.ObjectExpression.check(targetColumn)) return false;

      const componentsProperty = targetColumn.properties.find(p =>
        n.ObjectProperty.check(p) && isKey(p.key, 'components')
      );
      if (componentsProperty?.loc) {
        line = componentsProperty.loc.start.line;
        this.abort();
      }
      return false;
    }
  });
  return line;
}

// New Helper: find start/end lines of the target column object expression
function findTargetColumnRange(ast, columnName) {
  let range = null;
  recast.visit(ast, {
    visitExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      let objectExpressionNode = null;

      if (n.TSAsExpression.check(declaration) && n.ObjectExpression.check(declaration.expression)) {
        objectExpressionNode = declaration.expression;
      } else if (n.ObjectExpression.check(declaration)) {
        objectExpressionNode = declaration;
      } else if (n.Identifier.check(declaration)) {
        const varName = declaration.name;
        recast.visit(ast, {
          visitVariableDeclaration(path2) {
            for (const decl of path2.node.declarations) {
              if (
                n.VariableDeclarator.check(decl) &&
                n.Identifier.check(decl.id) &&
                decl.id.name === varName &&
                n.ObjectExpression.check(decl.init)
              ) {
                objectExpressionNode = decl.init;
                return false;
              }
            }
            this.traverse(path2);
          }
        });
      }

      if (!objectExpressionNode) return false;
      const isKey = (keyNode, name) => (n.Identifier.check(keyNode) && keyNode.name === name) || (n.StringLiteral.check(keyNode) && keyNode.value === name);

      const columnsProperty = objectExpressionNode.properties.find(prop =>
        n.ObjectProperty.check(prop) && isKey(prop.key, 'columns')
      );
      if (!columnsProperty || !n.ArrayExpression.check(columnsProperty.value)) return false;

      const columnsArray = columnsProperty.value.elements;
      const targetColumn = columnsArray.find(col => {
        if (n.ObjectExpression.check(col)) {
          const nameProp = col.properties.find(p =>
            n.ObjectProperty.check(p) && isKey(p.key, 'name') &&
            n.StringLiteral.check(p.value) && p.value.value === columnName
          );
          return !!nameProp;
        }
        return false;
      });
      if (targetColumn && n.ObjectExpression.check(targetColumn) && targetColumn.loc) {
        range = { start: targetColumn.loc.start.line, end: targetColumn.loc.end.line };
        this.abort();
      }
      return false;
    }
  });
  return range;
}

// Helper: remove all blank lines immediately before and after the specified line number
function removeBlankAroundLine(code, lineNumber) {
  if (!lineNumber || typeof lineNumber !== 'number') return code;
  const lines = code.split(/\r?\n/);
  let idx = Math.max(0, lineNumber - 1);
  // Remove consecutive blank lines before
  while (idx > 0 && lines[idx - 1] !== undefined && lines[idx - 1].trim() === '') {
    lines.splice(idx - 1, 1);
    idx -= 1;
  }
  // Remove consecutive blank lines after
  while (idx < lines.length - 1 && lines[idx + 1] !== undefined && lines[idx + 1].trim() === '') {
    lines.splice(idx + 1, 1);
  }
  return lines.join('\n');
}

// New Helper: remove all blank-only lines within a given [start, end] (inclusive) line range
function removeAllBlankLinesInRange(code, startLine, endLine) {
  if (!startLine || !endLine) return code;
  const lines = code.split(/\r?\n/);
  const startIdx = Math.max(0, startLine - 1);
  const endIdx = Math.min(lines.length - 1, endLine - 1);
  for (let i = endIdx - 1; i > startIdx; i--) {
    if (lines[i] !== undefined && lines[i].trim() === '') {
      lines.splice(i, 1);
    }
  }
  return lines.join('\n');
}


async function findResourceFilePath(resourceId) {
  const projectRoot = process.cwd();
  const resourcesDir = path.resolve(projectRoot, 'resources');
  console.log(chalk.dim(`Scanning for resource files in: ${resourcesDir}`));

  let tsFiles = [];
  try {
      const entries = await fs.readdir(resourcesDir, { withFileTypes: true });
      tsFiles = entries
          .filter(dirent => dirent.isFile() && dirent.name.endsWith('.ts') && !dirent.name.endsWith('.d.ts'))
          .map(dirent => dirent.name);
  } catch (error) {
      if (error.code === 'ENOENT') {
          throw new Error(`Resources directory not found at ${resourcesDir}. Please ensure it exists.`);
      }
      throw new Error(`Failed to read resources directory ${resourcesDir}: ${error.message}`);
  }


  for (const file of tsFiles) {
      const filePath = path.resolve(resourcesDir, file);
      console.log(chalk.dim(`Attempting to process file: ${file}`));
      try {
          const content = await fs.readFile(filePath, 'utf-8');
          const ast = recast.parse(content, {
              parser: typescriptParser 
          });

          let foundResourceId = null;

          recast.visit(ast, {
              visitExportDefaultDeclaration(path) {
                  if (foundResourceId !== null) return false; // Stop visiting deeper if already found

                  const declaration = path.node.declaration;
                  let objectExpressionNode = null;

                  if (n.TSAsExpression.check(declaration) && n.ObjectExpression.check(declaration.expression)) {
                      objectExpressionNode = declaration.expression;
                  } else if (n.ObjectExpression.check(declaration)) {
                      objectExpressionNode = declaration;
                  } else if (n.Identifier.check(declaration)) {
                      const varName = declaration.name;
                  
                      recast.visit(ast, {
                          visitVariableDeclaration(path) {
                              for (const decl of path.node.declarations) {
                                  if (
                                      n.VariableDeclarator.check(decl) &&
                                      n.Identifier.check(decl.id) &&
                                      decl.id.name === varName &&
                                      n.ObjectExpression.check(decl.init)
                                  ) {
                                      objectExpressionNode = decl.init;
                                      return false;
                                  }
                              }
                              this.traverse(path);
                          }
                      });
                  }

                  if (objectExpressionNode) {
                      const resourceIdProp = objectExpressionNode.properties.find(prop =>
                          n.ObjectProperty.check(prop) &&
                          n.Identifier.check(prop.key) &&
                          prop.key.name === 'resourceId' &&
                          n.StringLiteral.check(prop.value)
                      );
                      if (resourceIdProp) {
                          foundResourceId = resourceIdProp.value.value; // Get the string value
                          console.log(chalk.dim(`  Extracted resourceId '${foundResourceId}' from ${file}`));
                          this.abort(); // Stop traversal for this file once found
                      }
                  }
                  return false;
              }
          });

          console.log(chalk.dim(`  Finished processing ${file}. Found resourceId: ${foundResourceId || 'null'}`));

          if (foundResourceId === resourceId) {
              console.log(chalk.dim(`  Match found! Returning path: ${filePath}`));
              return filePath;
          }
      } catch (parseError) {
          if (parseError.message.includes('require is not defined')) {
               console.error(chalk.red(`❌ Internal Error: Failed to load Recast parser in ESM context for ${file}.`));
           } else {
              console.warn(chalk.yellow(`⚠️ Warning: Could not process file ${file}. Skipping. Error: ${parseError.message}`));
           }
      }
  }

  throw new Error(`Could not find a resource file in '${resourcesDir}' with resourceId: '${resourceId}'`);
}


export async function updateResourceConfig(resourceId, columnName, fieldType, componentPathForConfig) {
    const filePath = await findResourceFilePath(resourceId);
    console.log(chalk.dim(`Attempting to update resource config: ${filePath}`));

    let content;
    let injectionLine = null;
    try {
        content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(chalk.red(`❌ Error reading resource file: ${filePath}`));
        console.error(error);
        throw new Error(`Could not read resource file ${filePath}.`);
    }

    try {
        const ast = recast.parse(content, {
            parser: typescriptParser 
        });

        let updateApplied = false;

        recast.visit(ast, {
            visitExportDefaultDeclaration(path) {
                const declaration = path.node.declaration;
                let objectExpressionNode = null;

                if (n.TSAsExpression.check(declaration) && n.ObjectExpression.check(declaration.expression)) {
                    objectExpressionNode = declaration.expression;
                } else if (n.ObjectExpression.check(declaration)) {
                    objectExpressionNode = declaration;
                } else if (n.Identifier.check(declaration)) {
                    const varName = declaration.name;
                
                    recast.visit(ast, {
                        visitVariableDeclaration(path) {
                            for (const decl of path.node.declarations) {
                                if (
                                    n.VariableDeclarator.check(decl) &&
                                    n.Identifier.check(decl.id) &&
                                    decl.id.name === varName &&
                                    n.ObjectExpression.check(decl.init)
                                ) {
                                    objectExpressionNode = decl.init;
                                    return false;
                                }
                            }
                            this.traverse(path);
                        }
                    });
                }

                if (!objectExpressionNode) {
                    console.warn(chalk.yellow(`Warning: Default export in ${filePath} is not a recognized ObjectExpression or TSAsExpression containing one. Skipping update.`));
                    return false;
                }

                const properties = objectExpressionNode.properties;
                const columnsProperty = properties.find(prop =>
                    n.ObjectProperty.check(prop) && n.Identifier.check(prop.key) && prop.key.name === 'columns'
                );

                if (!columnsProperty || !n.ArrayExpression.check(columnsProperty.value)) {
                    console.warn(chalk.yellow(`Warning: Could not find 'columns' array in the default export of ${filePath}. Skipping update.`));
                    return false;
                }

                const columnsArray = columnsProperty.value.elements;
                const targetColumn = columnsArray.find(col => {
                    if (n.ObjectExpression.check(col)) {
                        const nameProp = col.properties.find(p =>
                            n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === 'name' &&
                            n.StringLiteral.check(p.value) && p.value.value === columnName
                        );
                        return !!nameProp;
                    }
                    return false;
                });

                if (!targetColumn || !n.ObjectExpression.check(targetColumn)) {
                    return false;
                }

                let componentsProperty = targetColumn.properties.find(p =>
                    n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === 'components'
                );

                if (!componentsProperty) {
                    const newComponentsObject = b.objectExpression([]);
                    componentsProperty = b.objectProperty(b.identifier('components'), newComponentsObject);

                    const nameIndex = targetColumn.properties.findIndex(p => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === 'name');
                    targetColumn.properties.splice(nameIndex !== -1 ? nameIndex + 1 : targetColumn.properties.length, 0, componentsProperty);
                    console.log(chalk.dim(`Added 'components' object to column '${columnName}'.`));

                } else if (!n.ObjectExpression.check(componentsProperty.value)) {
                    console.warn(chalk.yellow(`Warning: 'components' property in column '${columnName}' is not an object. Skipping update.`));
                    return false;
                }

                const componentsObject = componentsProperty.value;
                let fieldTypeProperty = componentsObject.properties.find(p =>
                    n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === fieldType
                );

                const newComponentValue = b.stringLiteral(componentPathForConfig);

                if (fieldTypeProperty) {
                    injectionLine = fieldTypeProperty.loc?.start.line ?? null;
                    fieldTypeProperty.value = newComponentValue;
                    console.log(chalk.dim(`Updated '${fieldType}' component path in column '${columnName}'.`));
                } else {
                    fieldTypeProperty = b.objectProperty(b.identifier(fieldType), newComponentValue);
                    componentsObject.properties.push(fieldTypeProperty);
                    fieldTypeProperty = componentsObject.properties.find(p =>
                        n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === fieldType
                    );
                    injectionLine = fieldTypeProperty.loc?.start.line ?? null;
                    console.log(chalk.dim(`Added '${fieldType}' component path to column '${columnName}'.`));
                }

                updateApplied = true;
                this.abort();
                return false;
            }
        });

        if (!updateApplied) {
             throw new Error(`Could not find column '${columnName}' or apply update within the default export's 'columns' array in ${filePath}.`);
        }

        // Print code
        const outputAstCode = recast.print(ast).code;
        // If we injected a new node (no loc), reparse to find its line
        let outputCode = outputAstCode;
        let componentsLine = null;
        let columnRange = null;
        try {
          const reparsed = recast.parse(outputAstCode, { parser: typescriptParser });
          if (injectionLine === null) {
            injectionLine = findComponentPropLine(reparsed, columnName, fieldType) ?? null;
          }
          // Also try to find the 'components' property line (useful when we created it)
          componentsLine = findComponentsPropLine(reparsed, columnName) ?? null;
          columnRange = findTargetColumnRange(reparsed, columnName) ?? null;
        } catch (_) {
          // Ignore reparse errors; fallback to raw outputAstCode
        }

        // Strip blank line before/after the injected field line
        if (injectionLine !== null) {
          outputCode = removeBlankAroundLine(outputCode, injectionLine);
        }
        // Strip blank line before/after the components property line (if we created/updated it)
        if (componentsLine !== null) {
          outputCode = removeBlankAroundLine(outputCode, componentsLine);
        }
        // Aggressively remove all blank-only lines inside the target column block
        if (columnRange) {
          outputCode = removeAllBlankLinesInRange(outputCode, columnRange.start, columnRange.end);
        }

        // Optionally compact runs of 3+ blank lines anywhere
        outputCode = outputCode.replace(/(\r?\n){3,}/g, '\n\n');

        // Optionally log the result for debugging
        // console.log(outputCode);
        await fs.writeFile(filePath, outputCode, 'utf-8');
        console.log(
          chalk.green(
            `✅ Successfully updated CRUD injection in resource file: ${filePath}` +
            (injectionLine !== null ? `:${injectionLine}` : '')
          )
        );

    } catch (error) {
        console.error(chalk.red(`❌ Error processing resource file: ${filePath}`));
        console.error(error);
        throw new Error(`Failed to update resource file ${path.basename(filePath)}: ${error.message}`);
    }
}


export async function injectLoginComponent(indexFilePath, componentPath, injectionType) {
    console.log(chalk.dim(`Reading file: ${indexFilePath}`));
    const content = await fs.readFile(indexFilePath, 'utf-8');
    const ast = recast.parse(content, {
      parser: typescriptParser,
    });
  
    let updated = false;
    let injectionLine = null;
    let targetProperty = null;
  
    recast.visit(ast, {
      visitNewExpression(path) {
        if (
          n.Identifier.check(path.node.callee) &&
          path.node.callee.name === 'AdminForth' &&
          path.node.arguments.length > 0 &&
          n.ObjectExpression.check(path.node.arguments[0])
        ) {
          const configObject = path.node.arguments[0];
  
          const getOrCreateProp = (obj, name) => {
            let prop = obj.properties.find(
              p => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === name
            );
            if (!prop) {
              const newObj = b.objectExpression([]);
              prop = b.objectProperty(b.identifier(name), newObj);
              obj.properties.push(prop);
              console.log(chalk.dim(`Added missing '${name}' property.`));
            }
            return prop.value;
          };
  
          const customization = getOrCreateProp(configObject, 'customization');
          if (!n.ObjectExpression.check(customization)) return false;
  
          const loginPageInjections = getOrCreateProp(customization, 'loginPageInjections');
          if (!n.ObjectExpression.check(loginPageInjections)) return false;
  
          // Determine target property based on injection type
          targetProperty = injectionType === 'beforeLogin' ? 'panelHeader' : 'underInputs';
          
          let targetProp = loginPageInjections.properties.find(
            p => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === targetProperty
          );
  
          if (targetProp) {
            const currentVal = targetProp.value;
            injectionLine = targetProp.loc?.start.line ?? null;
            if (n.StringLiteral.check(currentVal)) {
              if (currentVal.value !== componentPath) {
                targetProp.value = b.arrayExpression([
                  b.stringLiteral(currentVal.value),
                  b.stringLiteral(componentPath),
                ]);
                console.log(chalk.dim(`Converted '${targetProperty}' to array with existing + new path.`));
              } else {
                console.log(chalk.dim(`Component path already present as string. Skipping.`));
              }
            } else if (n.ArrayExpression.check(currentVal)) {
              const exists = currentVal.elements.some(
                el => n.StringLiteral.check(el) && el.value === componentPath
              );
              if (!exists) {
                currentVal.elements.push(b.stringLiteral(componentPath));
                console.log(chalk.dim(`Appended new component path to existing '${targetProperty}' array.`));
              } else {
                console.log(chalk.dim(`Component path already present in array. Skipping.`));
              }
            } else {
              console.warn(chalk.yellow(`⚠️ '${targetProperty}' is not a string or array. Skipping.`));
              return false;
            }
          } else {
            const newProperty = b.objectProperty(
              b.identifier(targetProperty), 
              b.stringLiteral(componentPath)
            );
            
            if (newProperty.loc) {
              console.log(chalk.dim(`Adding '${targetProperty}' at line: ${newProperty.loc.start.line}`));
            }
            
            loginPageInjections.properties.push(newProperty);
            console.log(chalk.dim(`Added '${targetProperty}': ${componentPath}`));
          }
  
          updated = true;
          this.abort();
        }
        return false;
      }
    });
  
    if (!updated) {
      throw new Error(`Could not find AdminForth configuration in file: ${indexFilePath}`);
    }
  
    const outputCode = recast.print(ast).code;
    await fs.writeFile(indexFilePath, outputCode, 'utf-8');
    console.log(
      chalk.green(
        `✅ Successfully updated login ${targetProperty} injection in: ${indexFilePath}` +
        (injectionLine !== null ? `:${injectionLine}` : '')
      )
    );
  }


export async function injectGlobalComponent(indexFilePath, injectionType, componentPath) {
    console.log(chalk.dim(`Reading file: ${indexFilePath}`));
    const content = await fs.readFile(indexFilePath, 'utf-8');
    const ast = recast.parse(content, {
        parser: typescriptParser,
    });

    let updated = false;
    let injectionLine = null;
    console.log(JSON.stringify(injectionType));
    recast.visit(ast, {
        visitNewExpression(path) {
            if (
                n.Identifier.check(path.node.callee) &&
                path.node.callee.name === 'AdminForth' &&
                path.node.arguments.length > 0 &&
                n.ObjectExpression.check(path.node.arguments[0])
            ) {
                const configObject = path.node.arguments[0];

                let customizationProp = configObject.properties.find(
                    p => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === 'customization'
                );

                if (!customizationProp) {
                    const customizationObj = b.objectExpression([]);
                    customizationProp = b.objectProperty(b.identifier('customization'), customizationObj);
                    configObject.properties.push(customizationProp);
                    console.log(chalk.dim(`Added missing 'customization' property.`));
                }
                
                const customizationValue = customizationProp.value;
                if (!n.ObjectExpression.check(customizationValue)) return false;

                let globalInjections = customizationValue.properties.find(
                    p => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === 'globalInjections'
                );

                if (!globalInjections) {
                    const injectionsObj = b.objectExpression([]);
                    globalInjections = b.objectProperty(b.identifier('globalInjections'), injectionsObj);
                    customizationValue.properties.push(globalInjections);
                    console.log(chalk.dim(`Added missing 'globalInjections'.`));
                }

                const injectionsValue = globalInjections.value;
                if (!n.ObjectExpression.check(injectionsValue)) return false;
                console.log(JSON.stringify(injectionType));
                let injectionProp = injectionsValue.properties.find(
                    p => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === injectionType
                );
                if (injectionProp) {
                    const currentValue = injectionProp.value;
                    injectionLine = injectionProp.loc?.start.line ?? null;
                    if (n.ArrayExpression.check(currentValue)) {
                      currentValue.elements.push(b.stringLiteral(componentPath));
                      console.log(chalk.dim(`Added '${componentPath}' to existing array in '${injectionType}'`));
                    } else if (n.StringLiteral.check(currentValue)) {
                      injectionProp.value = b.arrayExpression([
                        b.stringLiteral(currentValue.value),
                        b.stringLiteral(componentPath)
                      ]);
                      console.log(chalk.dim(`Converted '${injectionType}' from string to array and added '${componentPath}'`));
                    } else {
                      throw new Error(`Unsupported value type for '${injectionType}'. Must be string or array.`);
                    }
                  } else {
                    injectionsValue.properties.push(
                      b.objectProperty(
                        b.identifier(injectionType),
                        b.arrayExpression([b.stringLiteral(componentPath)])
                      )
                    );
                    console.log(chalk.dim(`Added new array for '${injectionType}' with '${componentPath}'`));
                  }
          
                  updated = true;
                  this.abort();
                }
                return false;
              }
    });

    if (!updated) {
        throw new Error(`Could not find AdminForth configuration in file: ${indexFilePath}`);
    }

    const outputCode = recast.print(ast).code;
    await fs.writeFile(indexFilePath, outputCode, 'utf-8');
    console.log(
      chalk.green(
        `✅ Successfully updated CRUD injection in resource file: ${indexFilePath}` +
        (injectionLine !== null ? `:${injectionLine}` : '')
      )
    );
}

export async function updateCrudInjectionConfig(resourceId, crudType, injectionPosition, componentPathForConfig, isThin) {
    const filePath = await findResourceFilePath(resourceId);
    console.log(chalk.dim(`Attempting to update resource CRUD injection: ${filePath}`));
  
    let content;
    let injectionLine = null;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(chalk.red(`❌ Error reading resource file: ${filePath}`));
      throw new Error(`Could not read resource file ${filePath}.`);
    }
  
    try {
      const ast = recast.parse(content, {
        parser: typescriptParser
      });
  
      let updateApplied = false;
  
      recast.visit(ast, {
        visitExportDefaultDeclaration(path) {
          const declaration = path.node.declaration;
          let objectExpressionNode = null;
  
          if (n.TSAsExpression.check(declaration) && n.ObjectExpression.check(declaration.expression)) {
              objectExpressionNode = declaration.expression;
          } else if (n.ObjectExpression.check(declaration)) {
              objectExpressionNode = declaration;
          } else if (n.Identifier.check(declaration)) {
              const varName = declaration.name;
          
              recast.visit(ast, {
                  visitVariableDeclaration(path) {
                      for (const decl of path.node.declarations) {
                          if (
                              n.VariableDeclarator.check(decl) &&
                              n.Identifier.check(decl.id) &&
                              decl.id.name === varName &&
                              n.ObjectExpression.check(decl.init)
                          ) {
                              objectExpressionNode = decl.init;
                              return false;
                          }
                      }
                      this.traverse(path);
                  }
              });
          }
  
          if (!objectExpressionNode) {
            console.warn(chalk.yellow(`Warning: Default export in ${filePath} is not an ObjectExpression. Skipping update.`));
            return false;
          }
  
          const getOrCreateObjectProp = (obj, propName) => {
            let prop = obj.properties.find(p => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === propName);
            if (!prop) {
              const newObject = b.objectExpression([]);
              prop = b.objectProperty(b.identifier(propName), newObject);
              obj.properties.push(prop);
            }
            return prop.value;
          };
  
          const options = getOrCreateObjectProp(objectExpressionNode, 'options');
          if (!n.ObjectExpression.check(options)) return false;
  
          const pageInjections = getOrCreateObjectProp(options, 'pageInjections');
          if (!n.ObjectExpression.check(pageInjections)) return false;
  
          let crudProp = pageInjections.properties.find(p =>
            n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === crudType
          );
  
          if (!crudProp) {
            crudProp = b.objectProperty(
              b.identifier(crudType),
              b.objectExpression([])
            );
            pageInjections.properties.push(crudProp);
          }
          injectionLine = crudProp.loc?.start.line ?? null;
          const crudValue = crudProp.value;
          if (!n.ObjectExpression.check(crudValue)) return false;
  
          let injectionProp = crudValue.properties.find(p =>
            n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === injectionPosition
          );
  
          const newInjectionObject = b.objectExpression([
            b.objectProperty(b.identifier('file'), b.stringLiteral(componentPathForConfig)),
            b.objectProperty(
              b.identifier('meta'),
              b.objectExpression([
                b.objectProperty(b.identifier('thinEnoughToShrinkTable'), b.booleanLiteral(!!isThin)),
              ])
            ),
          ]);
          
          if (injectionProp) {
            if (n.ArrayExpression.check(injectionProp.value)) {
              injectionProp.value.elements.push(newInjectionObject);
              console.log(chalk.dim(`Appended new injection to array at '${injectionPosition}' for '${crudType}'.`));
            }
            else if (n.ObjectExpression.check(injectionProp.value)) {
              injectionProp.value = b.arrayExpression([injectionProp.value, newInjectionObject]);
              console.log(chalk.dim(`Converted to array and added new injection at '${injectionPosition}' for '${crudType}'.`));
            }
            else {
              injectionProp.value = b.arrayExpression([newInjectionObject]);
              console.log(chalk.yellow(`⚠️ Replaced invalid injection at '${injectionPosition}' with array.`));
            }
          } else {
            crudValue.properties.push(
              b.objectProperty(b.identifier(injectionPosition), b.arrayExpression([newInjectionObject]))
            );
            console.log(chalk.dim(`Added new array of injections at '${injectionPosition}' for '${crudType}'.`));
          }
  
          updateApplied = true;
          this.abort();
          return false;
        }
      });
  
      if (!updateApplied) {
        throw new Error(`Could not inject CRUD component in resource ${resourceId}.`);
      }
  
      const outputCode = recast.print(ast).code;
      await fs.writeFile(filePath, outputCode, 'utf-8');
      console.log(
        chalk.green(
          `✅ Successfully updated CRUD injection in resource file: ${filePath}` +
          (injectionLine !== null ? `:${injectionLine}` : '')
        )
      );
  
    } catch (error) {
      console.error(chalk.red(`❌ Error processing resource file: ${filePath}`));
      throw new Error(`Failed to inject CRUD component in ${path.basename(filePath)}: ${error.message}`);
    }
  }