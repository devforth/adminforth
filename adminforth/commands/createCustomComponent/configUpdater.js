import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import recast from 'recast'; // Import recast
import * as typescriptParser from 'recast/parsers/typescript.js'; // Import the parser using ESM and include the .js extension

const b = recast.types.builders; // Like t.* in babel/types
const n = recast.types.namedTypes; // Like t.is* in babel/types


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

    console.log(chalk.dim(`Found .ts files to scan: ${tsFiles.join(', ') || 'None'}`));

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
                    }
                    else if (n.ObjectExpression.check(declaration)) {
                        objectExpressionNode = declaration;
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
                    fieldTypeProperty.value = newComponentValue;
                    console.log(chalk.dim(`Updated '${fieldType}' component path in column '${columnName}'.`));
                } else {
                    fieldTypeProperty = b.objectProperty(b.identifier(fieldType), newComponentValue);
                    componentsObject.properties.push(fieldTypeProperty);
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

        const outputCode = recast.print(ast).code;

        await fs.writeFile(filePath, outputCode, 'utf-8');
        console.log(chalk.dim(`Successfully updated resource configuration file (preserving formatting): ${filePath}`));

    } catch (error) {
        console.error(chalk.red(`❌ Error processing resource file: ${filePath}`));
        console.error(error);
        throw new Error(`Failed to update resource file ${path.basename(filePath)}: ${error.message}`);
    }
}
