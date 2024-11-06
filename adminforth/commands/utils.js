export const toPascalCase = (str) => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join("");
};

export const mapToTypeScriptType = (adminType) => {
  switch (adminType) {
    case "string":
    case "text":
    case "richtext":
    case "json":
    case "datetime":
    case "date":
    case "time":
      return "string";
    case "integer":
    case "float":
    case "decimal":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "any";
  }
};
